const Joi = require('joi');

const emailValidation = {
  // Send email validation
  sendEmail: Joi.object({
    contractId: Joi.number().integer().positive().optional(),
    to: Joi.when('action', {
      is: 'draft',
      then: Joi.string().email().optional().allow(''),
      otherwise: Joi.string().email().required()
    }),
    cc: Joi.string().optional().allow(''),
    bcc: Joi.string().optional().allow(''),
    subject: Joi.when('action', {
      is: 'draft',
      then: Joi.string().max(500).optional().allow(''),
      otherwise: Joi.string().min(1).max(500).required()
    }),
    body: Joi.when('action', {
      is: 'draft',
      then: Joi.string().optional().allow(''),
      otherwise: Joi.string().min(1).required()
    }),
    bodyHtml: Joi.string().optional(),
    emailType: Joi.string().valid('manual', 'auto_reminder', 'due_notice').default('manual'),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    scheduledSendAt: Joi.date().iso().greater('now').optional(),
    contractFiles: Joi.alternatives().try(
      Joi.array().items(Joi.number().integer().positive()),
      Joi.number().integer().positive()
    ).optional(),
    reminders: Joi.string().optional(), // JSON string of reminder dates
    action: Joi.string().valid('send', 'schedule', 'draft').required()
  }),

  // Update email validation
  updateEmail: Joi.object({
    to_email: Joi.string().email().optional(),
    cc_emails: Joi.string().optional().allow(''),
    bcc_emails: Joi.string().optional().allow(''),
    subject: Joi.string().min(1).max(500).optional(),
    body_text: Joi.string().min(1).optional(),
    body_html: Joi.string().optional(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
    scheduled_send_at: Joi.date().iso().greater('now').optional().allow(null)
  }),

  // Create template validation
  createTemplate: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    subjectTemplate: Joi.string().min(1).max(500).required(),
    bodyTemplate: Joi.string().min(1).required(),
    templateType: Joi.string().valid('custom', 'due_reminder', 'renewal_notice').default('custom')
  }),

  // Due reminder validation
  sendDueReminder: Joi.object({
    recipientEmail: Joi.string().email().required(),
    customMessage: Joi.string().optional()
  }),

  // Notification preferences validation
  updateNotificationPreferences: Joi.object({
    emailNotifications: Joi.boolean().required(),
    notificationPreference: Joi.object({
      '90_days': Joi.boolean().required(),
      '30_days': Joi.boolean().required(),
      '7_days': Joi.boolean().required(),
      'expired': Joi.boolean().required()
    }).required()
  }),

  // Query parameters validation
  emailHistory: Joi.object({
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(20),
    status: Joi.string().valid('draft', 'sent', 'failed', 'scheduled').optional()
  }),

  contractsDueSoon: Joi.object({
    days: Joi.number().integer().positive().max(365).default(90)
  }),

  getTemplates: Joi.object({
    type: Joi.string().valid('custom', 'due_reminder', 'renewal_notice').optional()
  })
};

module.exports = emailValidation;
