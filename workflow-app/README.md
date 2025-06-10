# Workflow Application

This project is a robust, stateless, and auditable workflow engine written in Node.js. It supports submission, approval/rejection, withdrawal, status/heartbeat, and is designed for extensibility, monitoring, and integration with PostgreSQL and notification services.

## Project Structure

```
workflow-app
├── src
│   ├── index.js          # Entry point of the application
│   ├── workflow.js       # Manages workflow logic
│   └── utils
│       └── helpers.js    # Utility functions
├── package.json          # NPM configuration file
├── .gitignore            # Files to ignore in Git
└── README.md             # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd workflow-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run the following command:
```
node src/index.js
```

## API Endpoints

| Endpoint                  | Method | Description                  | Role        |
|--------------------------|--------|------------------------------|-------------|
| `/workflow/submit`       | POST   | Submit new workflow          | submitter   |
| `/workflow/respond`      | POST   | Approver responds            | approver    |
| `/workflow/withdraw`     | POST   | Withdraw workflow            | submitter   |
| `/workflow/status/:id`   | GET    | Get workflow status/history  | any         |
| `/workflow/heartbeat`    | GET    | Health check                 | any         |

### Example: Submit Workflow
```json
POST /workflow/submit
{
  "user": { "id": "user1", "role": "submitter" },
  "data": { "assessmentId": "A123", "metadata": { "comments": "Initial" } }
}
```

### Example: Approver Respond
```json
POST /workflow/respond
{
  "user": { "id": "approver1", "role": "approver" },
  "id": "<workflow_id>",
  "trigger": "approve",
  "metadata": { "comments": "Looks good" }
}
```

### Example: Withdraw
```json
POST /workflow/withdraw
{
  "user": { "id": "user1", "role": "submitter" },
  "id": "<workflow_id>",
  "metadata": { "reason": "No longer needed" }
}
```

### Example: Status
```
GET /workflow/status/<workflow_id>
```

### Example: Heartbeat
```
GET /workflow/heartbeat
```

---

## PostgreSQL Table Schema
```sql
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  current_state VARCHAR(32) NOT NULL,
  triggered_by VARCHAR(64),
  metadata JSONB,
  workflow_definition_version VARCHAR(16),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  history JSONB NOT NULL
);
```

---

## Running the Project

1. **Install dependencies:**
   ```powershell
   cd workflow-app
   npm install
   ```
2. **Set up PostgreSQL:**
   - Ensure PostgreSQL is running and the `workflows` table is created (see schema above).
   - Set `PG_URI` in your environment if not using the default.
3. **Start the server:**
   ```powershell
   node src/index.js
   ```
4. **Run tests:**
   ```powershell
   npm install --save-dev jest supertest
   npx jest
   ```

---

## Extending the Engine
- **Add new states/triggers:** Edit `src/stateMachine.js`.
- **Add new endpoints or logic:** Edit `src/index.js` and `src/engine.js`.
- **Customize notifications:** Edit `src/notification.js`.
- **Enhance RBAC:** Replace the dummy `requireRole` middleware with real authentication/authorization logic.

---

## Error Logging & Monitoring
- Errors are logged to `workflow-error.log` in the project root.
- Health checks run every 60 seconds and are logged to the console.

---

## Contact & Contribution
- See `README.md` for contribution guidelines and contact info.

---

## License
MIT (or your organization’s preferred license)