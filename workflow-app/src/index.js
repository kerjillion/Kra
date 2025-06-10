const express = require('express');
const bodyParser = require('body-parser');
const Workflow = require('./workflow');
const helpers = require('./utils/helpers');
const { WorkflowEngine } = require('./engine');
const PersistenceAdapter = require('./persistence');
const NotificationService = require('./notification');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const workflow = new Workflow();
const persistence = new PersistenceAdapter();
const notifications = new NotificationService();
const engine = new WorkflowEngine(persistence);

// Example: subscribe to workflow signals
workflow.on('started', (state) => {
    console.log('Workflow started:', state);
});
workflow.on('completed', (state) => {
    console.log('Workflow completed:', state);
});
workflow.on('error', (err) => {
    console.error('Workflow error:', err.message);
});

// Example: subscribe to workflow engine events for notifications/logging
engine.on('transition', async (transition) => {
    try {
        const result = await notifications.notify(transition.event, transition.workflow, transition.recipients);
        console.log(`[NOTIFY] Event: ${transition.event}, Recipients: ${transition.recipients}, Delivered: ${result.delivered}`);
    } catch (err) {
        console.error(`[NOTIFY ERROR] Event: ${transition.event}, Recipients: ${transition.recipients}, Error: ${err.message}`);
    }
});

// Middleware: Dummy RBAC (replace with real logic)
function requireRole(roles) {
    return (req, res, next) => {
        // In real app, extract user from auth token/session
        const user = req.body.user || { id: 'anonymous', role: 'submitter' };
        if (!roles.includes(user.role)) {
            return res.status(403).json({ status: 'error', message: 'Forbidden: insufficient role' });
        }
        req.user = user;
        next();
    };
}

// Middleware: Basic payload validation
function requireFields(fields) {
    return (req, res, next) => {
        for (const f of fields) {
            if (!(f in req.body)) {
                return res.status(400).json({ status: 'error', message: `Missing field: ${f}` });
            }
        }
        next();
    };
}

// Error logging utility
function logErrorToFile(error, context = '') {
    const logFile = path.join(__dirname, '../workflow-error.log');
    const logEntry = `[${new Date().toISOString()}] [ERROR] ${context} ${error.stack || error.message}\n`;
    fs.appendFile(logFile, logEntry, err => {
        if (err) console.error('Failed to write error log:', err);
    });
}

// Global error handler middleware
app.use((err, req, res, next) => {
    logErrorToFile(err, 'Unhandled Exception:');
    res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Scheduled health check job (every 60 seconds)
setInterval(async () => {
    try {
        const health = await engine.heartbeat();
        console.log(`[HEALTH] ${new Date().toISOString()} -`, health);
    } catch (err) {
        logErrorToFile(err, 'Scheduled Health Check:');
    }
}, 60000);

// --- API Endpoints ---

// Submit new workflow
app.post('/workflow/submit', requireRole(['submitter']), requireFields(['data']), async (req, res) => {
    try {
        const result = await engine.submit(req.body.data, req.user);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// Approver responds (approve/reject)
app.post('/workflow/respond', requireRole(['approver']), requireFields(['id', 'trigger']), async (req, res) => {
    try {
        const { id, trigger, metadata } = req.body;
        const result = await engine.respond(id, trigger, req.user, metadata);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// Withdraw workflow
app.post('/workflow/withdraw', requireRole(['submitter']), requireFields(['id']), async (req, res) => {
    try {
        const { id, metadata } = req.body;
        const result = await engine.withdraw(id, req.user, metadata);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// Get workflow status/history
app.get('/workflow/status/:id', async (req, res) => {
    try {
        const result = await engine.status(req.params.id);
        if (!result) return res.status(404).json({ status: 'error', message: 'Not found' });
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
});

// Heartbeat/health check
app.get('/workflow/heartbeat', async (req, res) => {
    try {
        const result = await engine.heartbeat();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});