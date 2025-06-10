/**
 * Workflow State Machine Definition
 * States: Pending, Approved, Rejected, Withdrawn, Completed, Error
 * Triggers: submit, approve, reject, withdraw, complete, error
 * Transitions are explicit and auditable.
 */
const WORKFLOW_STATES = [
  'Pending',
  'Approved',
  'Rejected',
  'Withdrawn',
  'Completed',
  'Error',
];

const WORKFLOW_TRIGGERS = [
  'submit',
  'approve',
  'reject',
  'withdraw',
  'complete',
  'error',
];

const WORKFLOW_TRANSITIONS = {
  submit:   { from: null,         to: 'Pending',   roles: ['submitter'] },
  approve:  { from: 'Pending',    to: 'Approved',  roles: ['approver'] },
  reject:   { from: 'Pending',    to: 'Rejected',  roles: ['approver'] },
  withdraw: { from: 'Pending',    to: 'Withdrawn', roles: ['submitter'] },
  complete: [
    { from: 'Approved',  to: 'Completed', roles: ['system'] },
    { from: 'Rejected',  to: 'Completed', roles: ['system'] },
    { from: 'Withdrawn', to: 'Completed', roles: ['system'] },
  ],
  error:    { from: '*',          to: 'Error',     roles: ['system'] },
};

module.exports = {
  WORKFLOW_STATES,
  WORKFLOW_TRIGGERS,
  WORKFLOW_TRANSITIONS,
};
