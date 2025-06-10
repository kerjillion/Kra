const { WorkflowEngine } = require('../src/engine');
const PersistenceAdapter = require('../src/persistence');

describe('WorkflowEngine Rollback/Recovery', () => {
  let engine, persistence;

  beforeEach(() => {
    persistence = {
      createWorkflow: jest.fn(async (inst) => { throw new Error('DB down'); }),
      updateWorkflow: jest.fn(async (id, update, meta) => { throw new Error('DB down'); }),
      getWorkflow: jest.fn(async (id) => { throw new Error('DB down'); }),
    };
    engine = new WorkflowEngine(persistence);
  });

  test('submit handles DB failure gracefully', async () => {
    const user = { id: 'user1', role: 'submitter' };
    const data = { foo: 'bar' };
    await expect(engine.submit(data, user)).rejects.toThrow('DB down');
  });

  test('respond handles DB failure gracefully', async () => {
    const user = { id: 'approver1', role: 'approver' };
    await expect(engine.respond('mock-id', 'approve', user)).rejects.toThrow('DB down');
  });

  test('status handles DB failure gracefully', async () => {
    await expect(engine.status('mock-id')).rejects.toThrow('DB down');
  });

  // Add more rollback/recovery scenarios as needed
});
