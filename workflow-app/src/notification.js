/**
 * Notification Service (stub)
 * Replace with real email/SMS integration.
 */
class NotificationService {
  async notify(event, workflow, recipients) {
    // TODO: Send email/SMS
    return { delivered: true, event, recipients };
  }
}

module.exports = NotificationService;
