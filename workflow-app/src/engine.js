/**
 * Workflow Engine
 * Stateless engine for handling assessment transitions:
 * States: Pending, Approved, Rejected, Withdrawn, Completed, Error
 * API-driven transition logic with audit trail and metadata support.
 */
const EventEmitter = require('events');
const { WORKFLOW_STATES, WORKFLOW_TRANSITIONS } = require('./stateMachine');

class WorkflowEngine extends EventEmitter {
  /**
   * @param {object} persistence - Persistence adapter (e.g., MongoDB)
   */
  constructor(persistence) {
    super();
    this.persistence = persistence;
  }

  /**
   * Validate a transition is allowed
   */
  _validateTransition(currentState, trigger, role) {
    const transition = WORKFLOW_TRANSITIONS[trigger];
    if (!transition) throw new Error(`Invalid trigger: ${trigger}`);
    if (Array.isArray(transition)) {
      // Multiple possible transitions (e.g., complete)
      const match = transition.find(t => t.from === currentState);
      if (!match) throw new Error(`No transition from ${currentState} via ${trigger}`);
      if (match.roles && !match.roles.includes(role)) throw new Error(`Role ${role} not allowed for ${trigger}`);
      return match;
    } else {
      if (transition.from !== null && transition.from !== '*' && transition.from !== currentState) {
        throw new Error(`Cannot transition from ${currentState} via ${trigger}`);
      }
      if (transition.roles && !transition.roles.includes(role)) throw new Error(`Role ${role} not allowed for ${trigger}`);
      return transition;
    }
  }

  /**
   * Submit a new workflow
   */
  async submit(data, user) {
    const trigger = 'submit';
    const role = user.role;
    const transition = this._validateTransition(null, trigger, role);
    const instance = {
      ...data,
      currentState: transition.to,
      triggeredBy: user.id,
      metadata: data.metadata || {},
      workflowDefinitionVersion: '1.0',
    };
    const created = await this.persistence.createWorkflow(instance);
    this.emit('transition', { event: trigger, workflow: created, recipients: [user.id] });
    return created;
  }

  /**
   * Approver responds (approve/reject)
   */
  async respond(id, trigger, user, metadata = {}) {
    const workflow = await this.persistence.getWorkflow(id);
    if (!workflow) throw new Error('Workflow not found');
    const role = user.role;
    const transition = this._validateTransition(workflow.currentState, trigger, role);
    const update = {
      currentState: transition.to,
    };
    const updated = await this.persistence.updateWorkflow(id, update, {
      triggeredBy: user.id,
      metadata,
    });
    this.emit('transition', { event: trigger, workflow: updated, recipients: [user.id] });
    return updated;
  }

  /**
   * Withdraw a workflow
   */
  async withdraw(id, user, metadata = {}) {
    return this.respond(id, 'withdraw', user, metadata);
  }

  /**
   * Get workflow status/history
   */
  async status(id) {
    return this.persistence.getWorkflow(id);
  }

  /**
   * Heartbeat/health check
   */
  async heartbeat() {
    // For now, just return a simple status
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

module.exports = { WorkflowEngine };
