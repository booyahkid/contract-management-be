const emailService = require('../services/email.service');
const db = require('../config/db');
const emailValidation = require('./email.validation');

class EmailController {
  // Send email (immediate, scheduled, or save as draft)
  async sendEmail(req, res) {
    try {
      // Validate request data
      const { error, value } = emailValidation.sendEmail.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { action } = value;
      const userId = req.user.id;

      const emailData = {
        contractId: req.body.contractId,
        userId: userId,
        to: req.body.to,
        cc: req.body.cc,
        bcc: req.body.bcc,
        subject: req.body.subject,
        body: req.body.body,
        bodyHtml: req.body.bodyHtml,
        emailType: req.body.emailType || 'manual',
        priority: req.body.priority || 'normal',
        scheduledSendAt: req.body.scheduledSendAt
      };

      // Validation
      if (action !== 'draft' && (!emailData.to || !emailData.subject || !emailData.body)) {
        return res.status(400).json({ 
          error: 'To, subject, and body are required fields for sending or scheduling' 
        });
      }

      if (action === 'schedule' && !emailData.scheduledSendAt) {
        return res.status(400).json({ 
          error: 'Scheduled send time is required for scheduling' 
        });
      }

      // Save email
      const savedEmail = await emailService.saveEmailDraft(emailData);

      // Handle attachments if any
      if (req.files && req.files.length > 0) {
        await emailService.saveAttachments(savedEmail.id, req.files);
      }

      // Handle contract file attachments
      if (req.body.contractFiles) {
        const contractFiles = Array.isArray(req.body.contractFiles) 
          ? req.body.contractFiles 
          : [req.body.contractFiles];
        await emailService.saveAttachments(savedEmail.id, [], contractFiles);
      }

      // Handle reminders
      if (req.body.reminders) {
        const reminders = JSON.parse(req.body.reminders);
        await emailService.scheduleReminders(savedEmail.id, reminders);
      }

      let result = { emailId: savedEmail.id, status: 'saved' };

      // Send immediately if action is 'send'
      if (action === 'send') {
        result = await emailService.sendEmail(savedEmail.id);
      }

      res.json({
        message: `Email ${action === 'send' ? 'sent' : action === 'schedule' ? 'scheduled' : 'saved'} successfully`,
        data: result
      });
    } catch (error) {
      console.error('Send email error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get email history for a contract
  async getEmailHistory(req, res) {
    try {
      const { contractId } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT ce.*, 
               array_agg(
                 CASE WHEN ea.id IS NOT NULL THEN 
                   json_build_object(
                     'id', ea.id,
                     'fileName', ea.file_name,
                     'fileSize', ea.file_size,
                     'isContractFile', ea.is_contract_file
                   )
                 END
               ) FILTER (WHERE ea.id IS NOT NULL) as attachments
        FROM contract_emails ce
        LEFT JOIN email_attachments ea ON ce.id = ea.email_id
        WHERE ce.contract_id = $1 AND ce.user_id = $2
        GROUP BY ce.id
        ORDER BY ce.created_at DESC
      `;

      const { rows } = await db.query(query, [contractId, userId]);
      res.json(rows);
    } catch (error) {
      console.error('Get email history error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get all user's email history
  async getAllEmailHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE ce.user_id = $1';
      let queryParams = [userId];

      if (status) {
        whereClause += ' AND ce.status = $2';
        queryParams.push(status);
      }

      const query = `
        SELECT ce.*, c.contract_name, c.contract_number,
               COUNT(*) OVER() as total_count
        FROM contract_emails ce
        LEFT JOIN contracts c ON ce.contract_id = c.id
        ${whereClause}
        ORDER BY ce.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;

      queryParams.push(limit, offset);
      const { rows } = await db.query(query, queryParams);

      const totalCount = rows.length > 0 ? rows[0].total_count : 0;
      const emails = rows.map(row => {
        const { total_count, ...email } = row;
        return email;
      });

      res.json({
        emails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount: parseInt(totalCount),
          hasMore: page * limit < totalCount
        }
      });
    } catch (error) {
      console.error('Get all email history error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get email details by ID
  async getEmailById(req, res) {
    try {
      const { emailId } = req.params;
      const userId = req.user.id;

      const emailQuery = `
        SELECT ce.*, c.contract_name, c.contract_number, c.vendor
        FROM contract_emails ce
        JOIN contracts c ON ce.contract_id = c.id
        WHERE ce.id = $1 AND ce.user_id = $2
      `;

      const attachmentsQuery = `
        SELECT * FROM email_attachments WHERE email_id = $1
      `;

      const remindersQuery = `
        SELECT * FROM email_reminders WHERE email_id = $1 ORDER BY reminder_date ASC
      `;

      const [emailResult, attachmentsResult, remindersResult] = await Promise.all([
        db.query(emailQuery, [emailId, userId]),
        db.query(attachmentsQuery, [emailId]),
        db.query(remindersQuery, [emailId])
      ]);

      if (emailResult.rows.length === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }

      const email = emailResult.rows[0];
      email.attachments = attachmentsResult.rows;
      email.reminders = remindersResult.rows;

      res.json(email);
    } catch (error) {
      console.error('Get email by ID error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update email (for drafts)
  async updateEmail(req, res) {
    try {
      const { emailId } = req.params;
      const userId = req.user.id;

      // Check if email exists and is a draft
      const emailCheck = await db.query(
        'SELECT * FROM contract_emails WHERE id = $1 AND user_id = $2 AND status = $3',
        [emailId, userId, 'draft']
      );

      if (emailCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Draft email not found' });
      }

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const allowedFields = ['to_email', 'cc_emails', 'bcc_emails', 'subject', 'body_text', 'body_html', 'priority', 'scheduled_send_at'];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          
          if (field === 'cc_emails' || field === 'bcc_emails') {
            // Handle both string and array input
            if (Array.isArray(req.body[field])) {
              updateValues.push(req.body[field]);
            } else {
              updateValues.push(req.body[field] ? req.body[field].split(',').map(email => email.trim()) : []);
            }
          } else {
            updateValues.push(req.body[field]);
          }
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(emailId);

      const query = `
        UPDATE contract_emails 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING *
      `;
      updateValues.push(userId);

      const { rows } = await db.query(query, updateValues);
      res.json({ message: 'Email updated successfully', email: rows[0] });
    } catch (error) {
      console.error('Update email error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update draft and send/schedule it
  async updateAndSendDraft(req, res) {
    try {
      const { emailId } = req.params;
      const userId = req.user.id;
      
      // Handle FormData - action might be sent as FormData
      const action = req.body.action;
      
      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      // Check if email exists and is a draft
      const emailCheck = await db.query(
        'SELECT * FROM contract_emails WHERE id = $1 AND user_id = $2 AND status = $3',
        [emailId, userId, 'draft']
      );

      if (emailCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Draft email not found' });
      }

      // First update the email content
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const allowedFields = ['to_email', 'cc_emails', 'bcc_emails', 'subject', 'body_text', 'body_html', 'priority', 'scheduled_send_at'];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          
          if (field === 'cc_emails' || field === 'bcc_emails') {
            // Handle FormData arrays - they come as JSON strings
            let emailArray = [];
            try {
              if (typeof req.body[field] === 'string') {
                // Try to parse as JSON first (from FormData)
                emailArray = JSON.parse(req.body[field]);
              } else if (Array.isArray(req.body[field])) {
                emailArray = req.body[field];
              }
            } catch (e) {
              // If JSON parse fails, treat as comma-separated string
              emailArray = req.body[field] ? req.body[field].split(',').map(email => email.trim()) : [];
            }
            updateValues.push(emailArray);
          } else {
            updateValues.push(req.body[field]);
          }
          paramCount++;
        }
      }

      // Update status based on action
      if (action === 'send') {
        updateFields.push(`status = $${paramCount}`);
        updateValues.push('sent');
        paramCount++;
        
        updateFields.push(`sent_at = $${paramCount}`);
        updateValues.push(new Date().toISOString());
        paramCount++;
      } else if (action === 'schedule') {
        updateFields.push(`status = $${paramCount}`);
        updateValues.push('scheduled');
        paramCount++;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(emailId);

      const query = `
        UPDATE contract_emails 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
        RETURNING *
      `;
      updateValues.push(userId);

      const { rows } = await db.query(query, updateValues);
      const updatedEmail = rows[0];

      // Handle attachments if any
      if (req.files && req.files.length > 0) {
        await emailService.saveAttachments(emailId, req.files);
      }

      // If action is 'send', actually send the email
      if (action === 'send') {
        try {
          await emailService.sendEmail(emailId);
        } catch (sendError) {
          // If sending fails, update status to 'failed'
          await db.query(
            'UPDATE contract_emails SET status = $1, error_message = $2 WHERE id = $3',
            ['failed', sendError.message, emailId]
          );
          return res.status(500).json({ 
            error: 'Failed to send email', 
            details: sendError.message 
          });
        }
      }

      const actionText = action === 'send' ? 'sent' : action === 'schedule' ? 'scheduled' : 'updated';
      res.json({ 
        message: `Draft ${actionText} successfully`, 
        email: updatedEmail 
      });
    } catch (error) {
      console.error('Update and send draft error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete email
  async deleteEmail(req, res) {
    try {
      const { emailId } = req.params;
      const userId = req.user.id;

      const result = await db.query(
        'DELETE FROM contract_emails WHERE id = $1 AND user_id = $2 RETURNING *',
        [emailId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }

      res.json({ message: 'Email deleted successfully' });
    } catch (error) {
      console.error('Delete email error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get email templates
  async getTemplates(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      let query = 'SELECT * FROM email_templates WHERE (user_id = $1 OR user_id = 1) AND is_active = true';
      let params = [userId];

      if (type) {
        query += ' AND template_type = $2';
        params.push(type);
      }

      query += ' ORDER BY template_type, name';

      const { rows } = await db.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create email template
  async createTemplate(req, res) {
    try {
      const userId = req.user.id;
      const { name, subject_template, body_template, template_type, is_active = true } = req.body;

      if (!name || !subject_template || !body_template) {
        return res.status(400).json({ 
          error: 'Name, subject template, and body template are required' 
        });
      }

      const query = `
        INSERT INTO email_templates (user_id, name, subject_template, body_template, template_type, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const { rows } = await db.query(query, [
        userId, name, subject_template, body_template, template_type || 'manual', is_active
      ]);

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update email template
  async updateTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.id;
      const { name, subject_template, body_template, template_type, is_active } = req.body;

      // Check if template exists and belongs to user
      const templateCheck = await db.query(
        'SELECT * FROM email_templates WHERE id = $1 AND (user_id = $2 OR user_id = 1)',
        [templateId, userId]
      );

      if (templateCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Only allow updating own templates (not system templates with user_id = 1)
      if (templateCheck.rows[0].user_id === 1) {
        return res.status(403).json({ error: 'Cannot modify system templates' });
      }

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      const allowedFields = ['name', 'subject_template', 'body_template', 'template_type', 'is_active'];
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(req.body[field]);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(templateId);

      const query = `
        UPDATE email_templates 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const { rows } = await db.query(query, updateValues);
      res.json(rows[0]);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Delete email template
  async deleteTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.id;

      // Check if template exists and belongs to user
      const templateCheck = await db.query(
        'SELECT * FROM email_templates WHERE id = $1 AND user_id = $2',
        [templateId, userId]
      );

      if (templateCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found or access denied' });
      }

      const result = await db.query(
        'DELETE FROM email_templates WHERE id = $1 AND user_id = $2 RETURNING *',
        [templateId, userId]
      );

      res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get contracts due soon
  async getContractsDueSoon(req, res) {
    try {
      const userId = req.user.id;
      const { days = 90 } = req.query;

      const query = `
        SELECT c.*, 
               (c.end_date - CURRENT_DATE) as days_until_due,
               CASE 
                 WHEN c.end_date - CURRENT_DATE <= 7 THEN 'urgent'
                 WHEN c.end_date - CURRENT_DATE <= 30 THEN 'warning'
                 ELSE 'info'
               END as urgency_level
        FROM contracts c
        WHERE c.end_date IS NOT NULL
        AND c.end_date >= CURRENT_DATE
        AND c.end_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
        ORDER BY c.end_date ASC
      `;

      const { rows } = await db.query(query);
      res.json(rows);
    } catch (error) {
      console.error('Get contracts due soon error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Send due date reminder
  async sendDueReminder(req, res) {
    try {
      const { contractId } = req.params;
      const { recipientEmail, customMessage } = req.body;

      // Get contract details
      const contractQuery = await db.query(
        'SELECT * FROM contracts WHERE id = $1',
        [contractId]
      );

      if (contractQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const contract = contractQuery.rows[0];
      const daysUntilDue = Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24));

      // Create email data
      const emailData = {
        contractId: contractId,
        userId: req.user.id,
        to: recipientEmail,
        subject: `Contract Due in ${daysUntilDue} Days: ${contract.contract_name}`,
        body: customMessage || `Contract "${contract.contract_name}" is due for renewal in ${daysUntilDue} days.`,
        emailType: 'due_reminder',
        priority: daysUntilDue <= 7 ? 'urgent' : daysUntilDue <= 30 ? 'high' : 'normal'
      };

      const savedEmail = await emailService.saveEmailDraft(emailData);
      const result = await emailService.sendEmail(savedEmail.id);

      res.json({
        message: 'Due reminder sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Send due reminder error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const { emailNotifications, notificationPreference } = req.body;

      const query = `
        UPDATE users 
        SET email_notifications = $1, notification_preference = $2
        WHERE id = $3
        RETURNING email_notifications, notification_preference
      `;

      const { rows } = await db.query(query, [
        emailNotifications,
        JSON.stringify(notificationPreference),
        userId
      ]);

      res.json({
        message: 'Notification preferences updated successfully',
        preferences: rows[0]
      });
    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get email statistics
  async getEmailStats(req, res) {
    try {
      const userId = req.user.id;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_emails,
          COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_emails,
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_emails,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
          COUNT(*) FILTER (WHERE email_type = 'auto_reminder') as auto_reminders,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as emails_last_30_days
        FROM contract_emails
        WHERE user_id = $1
      `;

      const { rows } = await db.query(statsQuery, [userId]);
      res.json(rows[0]);
    } catch (error) {
      console.error('Get email stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new EmailController();
