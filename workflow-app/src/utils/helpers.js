module.exports = {
    validateInput: (input) => {
        // Perform validation on the input
        if (!input || typeof input !== 'object') {
            throw new Error('Invalid input: must be a non-empty object');
        }
        // Additional validation logic can be added here
    },

    formatResponse: (data) => {
        // Format the response data
        return {
            status: 'success',
            data: data,
            timestamp: new Date().toISOString()
        };
    },

    handleError: (error) => {
        // Handle errors and format them for the response
        return {
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        };
    }
};