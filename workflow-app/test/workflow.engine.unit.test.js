const { WorkflowEngine } = require('../src/engine');
const PersistenceAdapter = require('../src/persistence');
const stateMachine = require('../src/stateMachine');

describe('WorkflowEngine Unit', () => {
  let engine, persistence;

  beforeEach(() => {
    persistence = {
      createWorkflow: jest.fn(async (inst) => ({ ...inst, _id: 'mock-id' })),
      updateWorkflow: jest.fn(async (id, update, meta) => ({ _id: id, ...update })),
      getWorkflow: jest.fn(async (id) => ({ _id: id, currentState: 'Pending', triggeredBy: 'user1', metadata: {} })),
    };
    engine = new WorkflowEngine(persistence);
  });

  test('submit creates workflow in Pending', async () => {
    const user = { id: 'user1', role: 'submitter' };
    const data = { foo: 'bar' };
    const result = await engine.submit(data, user);
    expect(result.currentState).toBe('Pending');
    expect(persistence.createWorkflow).toHaveBeenCalled();
  });

  test('approve transitions to Approved', async () => {
    persistence.getWorkflow = jest.fn(async (id) => ({ _id: id, currentState: 'Pending', triggeredBy: 'user1', metadata: {} }));
    const user = { id: 'approver1', role: 'approver' };
    const result = await engine.respond('mock-id', 'approve', user);
    expect(result.currentState).toBe('Approved');
    expect(persistence.updateWorkflow).toHaveBeenCalled();
  });

  test('reject transitions to Rejected', async () => {
    persistence.getWorkflow = jest.fn(async (id) => ({ _id: id, currentState: 'Pending', triggeredBy: 'user1', metadata: {} }));
    const user = { id: 'approver1', role: 'approver' };
    const result = await engine.respond('mock-id', 'reject', user);
    expect(result.currentState).toBe('Rejected');
  });

  test('withdraw transitions to Withdrawn', async () => {
    persistence.getWorkflow = jest.fn(async (id) => ({ _id: id, currentState: 'Pending', triggeredBy: 'user1', metadata: {} }));
    const user = { id: 'user1', role: 'submitter' };
    const result = await engine.withdraw('mock-id', user);
    expect(result.currentState).toBe('Withdrawn');
  });

  test('invalid transition throws error', async () => {
    persistence.getWorkflow = jest.fn(async (id) => ({ _id: id, currentState: 'Approved', triggeredBy: 'user1', metadata: {} }));
    const user = { id: 'approver1', role: 'approver' };
    await expect(engine.respond('mock-id', 'approve', user)).rejects.toThrow();
  });

  test('RBAC error throws', async () => {
    persistence.getWorkflow = jest.fn(async (id) => ({ _id: id, currentState: 'Pending', triggeredBy: 'user1', metadata: {} }));
    const user = { id: 'user1', role: 'submitter' };
    await expect(engine.respond('mock-id', 'approve', user)).rejects.toThrow();
  });

  // Add more unit tests for edge cases, rollback, and error scenarios
});
