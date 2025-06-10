const { WorkflowEngine } = require('../src/engine');
const PersistenceAdapter = require('../src/persistence');

describe('WorkflowEngine Contract', () => {
  let engine, persistence;

  beforeEach(() => {
    persistence = {
      createWorkflow: jest.fn(async (inst) => ({ ...inst, _id: 'mock-id' })),
      updateWorkflow: jest.fn(async (id, update, meta) => ({ _id: id, ...update })),
      getWorkflow: jest.fn(async (id) => ({ _id: id, currentState: 'Pending', triggeredBy: 'user1', metadata: {} })),
    };
    engine = new WorkflowEngine(persistence);
  });

  test('API contract: submit returns required fields', async () => {
    const user = { id: 'user1', role: 'submitter' };
    const data = { foo: 'bar' };
    const result = await engine.submit(data, user);
    expect(result).toHaveProperty('_id');
    expect(result).toHaveProperty('currentState');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
    expect(result).toHaveProperty('history');
  });

  test('API contract: status returns full history', async () => {
    persistence.getWorkflow = jest.fn(async (id) => ({
      _id: id,
      currentState: 'Approved',
      history: [
        { state: 'Pending', timestamp: new Date(), triggeredBy: 'user1', metadata: {} },
        { state: 'Approved', timestamp: new Date(), triggeredBy: 'approver1', metadata: {} },
      ],
    }));
    const result = await engine.status('mock-id');
    expect(result.history.length).toBeGreaterThan(1);
    expect(result.history[0].state).toBe('Pending');
    expect(result.history[1].state).toBe('Approved');
  });

  // Add more contract tests as needed
});
