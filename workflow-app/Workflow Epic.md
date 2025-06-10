# Workflow Epic: Replace Legacy Approval Workflow Engine

## Objective
Migrate from Windows Workflow Foundation (WF) to a home-grown, maintainable, and scalable workflow engine that integrates cleanly with existing APIs, databases, and UIs while preserving business logic and approval processes.

## ✅ Acceptance Criteria
- **Functional Parity:** Submission, Approval/Rejection, Withdrawal, Approver Changes, Heartbeat/Status
- **State Management:** Auditable transitions: Pending, Approved, Rejected, Withdrawn, Completed, Error
- **API Compatibility:** Maintain existing API endpoints with minimal or no change
- **Database Integration:** Persist state/history in the existing schema or clearly documented schema
- **Notifications:** Maintain existing email/SMS/etc. notifications for approvers, submitters, admins
- **Monitoring:** Health check and workflow visibility via scheduled job/endpoint
- **Extensibility:** Easily add/modify workflow states and steps
- **Authorization:** Role-based access control to restrict actions (e.g., submitters, approvers, admins)
- **Documentation:** Provide state diagrams, API contracts, migration steps
- **Testing:** Unit/integration tests for all workflow scenarios and edge cases, contract tests, rollback/recovery scenarios

## 🧱 Design Details
- **Workflow Engine Implementation:**
  - Custom Node.js engine, stateless, modular, error-handled
- **Workflow Definition:**
  - States/transitions defined in code/config, deterministic state machine, metadata per transition
- **API Layer:**
  - RESTful endpoints: `/workflow/submit`, `/workflow/respond`, `/workflow/withdraw`, `/workflow/status/:id`, `/workflow/heartbeat`
  - Middleware for validation and RBAC
- **Persistence:**
  - Store instance, state, history, metadata, versioning
- **Notifications:**
  - Trigger notifications on transitions, log delivery
- **Monitoring:**
  - Health endpoint/job, error/transition logging
- **Migration:**
  - Allow in-flight workflows to complete or migrate, avoid data loss
- **Documentation & Training:**
  - Document architecture, state models, API, migration, onboarding
- **Operational Metrics:**
  - Workflows by status, time in state, failed transitions, notification delivery
- **Pre-Approved Paths (Optional):**
  - Auto-transitions for business rules

## 🧪 Spikes
- **Spike 1:** Define architecture and state engine interfaces
- **Spike 2:** Prototype stateless Node.js state machine (MongoDB/PostgreSQL)
- **Spike 3:** API compatibility validation

## 👤 User Stories
- **Submitter:** Can submit an assessment → “Pending”
- **Approver:** Can approve/reject → changes state and notifies
- **Submitter:** Can withdraw → “Withdrawn”
- **Admin:** Can monitor status → health/status endpoint
- **Developer:** Can extend workflow → modular, testable logic

## 🧩 Design Document
### Architecture Overview
- **Frontend:** Angular (unchanged)
- **Backend:** Node.js/Express REST API (stateless)
- **Workflow Engine:** Custom Node.js service
- **Database:** MongoDB or PostgreSQL
- **Notifications:** NodeMailer or equivalent

### Workflow Model
| State     | Trigger/Event       | Next State |
|-----------|--------------------|------------|
| Pending   | Approver approves  | Approved   |
| Pending   | Approver rejects   | Rejected   |
| Pending   | Submitter withdraws| Withdrawn  |
| Approved  | -                  | Completed  |
| Rejected  | -                  | Completed  |
| Withdrawn | -                  | Completed  |
| Any       | Error              | Error      |

### API Endpoints
| Endpoint               | Method | Description             |
|------------------------|--------|-------------------------|
| /workflow/submit       | POST   | Submit new assessment   |
| /workflow/respond      | POST   | Approver responds       |
| /workflow/withdraw     | POST   | Withdraw assessment     |
| /workflow/status/:id   | GET    | Get status/history      |
| /workflow/heartbeat    | GET    | Monitor workflow health |

### MongoDB Schema Example
```
{
  "assessmentId": "string",
  "currentState": "string",
  "history": [
    {
      "state": "string",
      "timestamp": "date",
      "triggeredBy": "string",
      "metadata": {
        "reason": "string",
        "comments": "string"
      }
    }
  ],
  "workflowDefinitionVersion": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 🧠 Key Design Decisions
- Stateless, API-driven
- Deterministic state machine
- Persist state/history for traceability
- Legacy-compatible API
- Decoupled notifications
- Modular, extensible engine
- Versioning and validation hooks

## 📆 Implementation Phases
1. **Foundation & Planning:** Architecture, interfaces, CI/CD, initial workflows, API contracts
2. **Core Engine & Persistence:** Engine logic, transitions, persistence, metadata, unit tests
3. **API Layer & Integration:** Full API, middleware, RBAC, front-end integration, legacy support
4. **Notifications & Monitoring:** Notification service, monitoring endpoints/logs, metrics
5. **Migration Path:** Dual-write/shadow mode, new submissions to new engine, monitor/migrate, versioning
6. **Harden & Extend:** Finalize tests, train/support, auto-approvals, optimize

## 🤖 Copilot Enablement & Prompting Guidelines
- Use latest Node.js LTS
- ESLint/Prettier configs
- JSDoc for major functions/modules
- Prompting: see code comments for transition and logging examples
- Bootstrapping: add header in main engine files

## 🛠️ Migration Plan
- Deploy new engine in parallel
- Route new submissions to new engine
- Allow legacy workflows to complete; decommission WF gradually

## ⚠️ Risks & Mitigations
| Risk                | Mitigation                                 |
|---------------------|--------------------------------------------|
| Data loss           | Dual-write or audit-logged cutover         |
| API incompatibility | Contract testing, backward compatibility   |
| Missed logic        | Comprehensive tests, stakeholder review    |
