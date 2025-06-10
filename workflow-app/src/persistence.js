/**
 * Persistence Adapter (PostgreSQL)
 * Uses the 'pg' Node.js driver.
 * NOTE: Replace connection config as needed.
 */
const { Pool } = require('pg');

class PersistenceAdapter {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.PG_URI || 'postgresql://postgres:postgres@localhost:5432/workflowdb',
    });
  }

  async createWorkflow(instance) {
    const client = await this.pool.connect();
    try {
      const now = new Date();
      const result = await client.query(
        `INSERT INTO workflows (data, current_state, triggered_by, metadata, workflow_definition_version, created_at, updated_at, history)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          JSON.stringify(instance),
          instance.currentState,
          instance.triggeredBy || null,
          JSON.stringify(instance.metadata || {}),
          instance.workflowDefinitionVersion || '1.0',
          now,
          now,
          JSON.stringify([
            {
              state: instance.currentState,
              timestamp: now,
              triggeredBy: instance.triggeredBy || null,
              metadata: instance.metadata || {},
            },
          ]),
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateWorkflow(id, update, transitionMeta) {
    const client = await this.pool.connect();
    try {
      const now = new Date();
      // Fetch current history
      const { rows } = await client.query('SELECT history FROM workflows WHERE id = $1', [id]);
      const history = rows[0] ? JSON.parse(rows[0].history) : [];
      const newEntry = {
        state: update.currentState,
        timestamp: now,
        triggeredBy: transitionMeta.triggeredBy,
        metadata: transitionMeta.metadata || {},
      };
      history.push(newEntry);
      const result = await client.query(
        `UPDATE workflows SET current_state = $1, updated_at = $2, history = $3 WHERE id = $4 RETURNING *`,
        [update.currentState, now, JSON.stringify(history), id]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getWorkflow(id) {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM workflows WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async logTransition(id, transition) {
    const client = await this.pool.connect();
    try {
      const now = new Date();
      const { rows } = await client.query('SELECT history FROM workflows WHERE id = $1', [id]);
      const history = rows[0] ? JSON.parse(rows[0].history) : [];
      const newEntry = {
        state: transition.state,
        timestamp: now,
        triggeredBy: transition.triggeredBy,
        metadata: transition.metadata || {},
      };
      history.push(newEntry);
      await client.query(
        `UPDATE workflows SET history = $1, updated_at = $2 WHERE id = $3`,
        [JSON.stringify(history), now, id]
      );
      return true;
    } finally {
      client.release();
    }
  }
}

module.exports = PersistenceAdapter;
