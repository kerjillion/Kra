const EventEmitter = require('events');
const helpers = require('./utils/helpers');
const fs = require('fs');
const path = require('path');

class Workflow extends EventEmitter {
    constructor() {
        super();
        this.workflowState = {};
        this.logFile = path.join(__dirname, '../workflow.log');
        this.on('started', (state) => this.logEvent('started', state));
        this.on('completed', (state) => this.logEvent('completed', state));
        this.on('error', (error) => this.logEvent('error', { message: error.message, stack: error.stack }));
    }

    logEvent(event, data) {
        const logEntry = `[${new Date().toISOString()}] [${event.toUpperCase()}] ${JSON.stringify(data)}\n`;
        fs.appendFile(this.logFile, logEntry, (err) => {
            if (err) {
                console.error('Failed to write log:', err);
            }
        });
    }

    startWorkflow(data) {
        try {
            helpers.validateInput(data);
            this.workflowState = { ...data, status: 'started' };
            this.emit('started', this.workflowState); // Signal: workflow started
            return Promise.resolve(helpers.formatResponse(this.workflowState));
        } catch (error) {
            this.emit('error', error); // Signal: error
            return Promise.reject(error);
        }
    }

    sendResponse(responseData) {
        try {
            const response = {
                ...this.workflowState,
                response: responseData,
                status: 'completed'
            };
            this.emit('completed', response); // Signal: workflow completed
            return helpers.formatResponse(response);
        } catch (error) {
            this.emit('error', error); // Signal: error
            return helpers.handleError(error);
        }
    }
}

module.exports = Workflow;