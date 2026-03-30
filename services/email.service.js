const nodemailer = require('nodemailer');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async saveEmailDraft(emailData) {
    try {
      const query = `
        INSERT INTO contract_emails 
        (contract_id, user_id, to_email, cc_emails, bcc_emails, subject, body_text, body_html, 
         email_type, priority, scheduled_send_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        emailData.contractId,
        emailData.userId,
        emailData.to,
        emailData.cc ? emailData.cc.split(',').map(email => email.trim()) : [],
        emailData.bcc ? emailData.bcc.split(',').map(email => email.trim()) : [],
        emailData.subject,
        emailData.body,
        emailData.bodyHtml || this.generateHtmlBody(emailData.body),
        emailData.emailType || 'manual',
        emailData.priority || 'normal',
        emailData.scheduledSendAt || null,
        emailData.scheduledSendAt ? 'scheduled' : 'draft'
      ];

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to save email: ${error.message}`);
    }
  }

  async saveAttachments(emailId, attachments, contractFiles = []) {
    try {
      // Save uploaded file attachments
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          await db.query(`
            INSERT INTO email_attachments 
            (email_id, file_name, file_path, file_size, mime_type, is_contract_file)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [emailId, file.originalname, file.path, file.size, file.mimetype, false]);
        }
      }

      // Link existing contract files
      if (contractFiles && contractFiles.length > 0) {
        for (const contractFileId of contractFiles) {
          const contractFile = await db.query(
            'SELECT * FROM contract_files WHERE id = $1',
            [contractFileId]
          );

          if (contractFile.rows.length > 0) {
            const file = contractFile.rows[0];
            await db.query(`
              INSERT INTO email_attachments 
              (email_id, file_name, file_path, file_size, mime_type, is_contract_file, contract_file_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [emailId, file.original_name, file.file_path, file.size, file.mime_type, true, file.id]);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to save attachments: ${error.message}`);
    }
  }

  async sendEmail(emailId) {
    try {
      // Get email details with contract and user info
      const emailQuery = await db.query(`
        SELECT ce.*, c.contract_name, c.contract_number, c.vendor, c.end_date,
               u.name as sender_name, u.email as sender_email
        FROM contract_emails ce
        LEFT JOIN contracts c ON ce.contract_id = c.id
        JOIN users u ON ce.user_id = u.id
        WHERE ce.id = $1
      `, [emailId]);

      if (emailQuery.rows.length === 0) {
        throw new Error('Email not found');
      }

      const email = emailQuery.rows[0];

      // Get attachments
      const attachmentsQuery = await db.query(`
        SELECT * FROM email_attachments WHERE email_id = $1
      `, [emailId]);

      const attachments = attachmentsQuery.rows.map(att => ({
        filename: att.file_name,
        path: att.file_path,
        cid: att.is_contract_file ? `contract_${att.contract_file_id}` : undefined
      }));

      // Prepare email content with template variables replaced
      const processedSubject = this.replaceTemplateVariables(email.subject, email);
      const processedBody = this.replaceTemplateVariables(email.body_text, email);
      const processedHtml = email.body_html ? 
        this.replaceTemplateVariables(email.body_html, email) : 
        this.generateHtmlBody(processedBody);

      // Send email
      const mailOptions = {
        from: `Infrastructure IPM Team <${process.env.SMTP_USER}>`,
        to: email.to_email,
        cc: email.cc_emails,
        bcc: email.bcc_emails,
        subject: processedSubject,
        text: processedBody,
        html: processedHtml,
        attachments: attachments,
        headers: {
          'X-Contract-ID': email.contract_id,
          'X-Email-ID': emailId,
          'X-Priority': email.priority === 'urgent' ? '1' : email.priority === 'high' ? '2' : '3'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Update email status
      await db.query(`
        UPDATE contract_emails 
        SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [emailId]);

      console.log(`✅ Email sent successfully: ${info.messageId}`);
      return { status: 'sent', messageId: info.messageId, sentAt: new Date() };
    } catch (error) {
      console.error(`❌ Failed to send email:`, error);
      
      // Update email as failed
      await db.query(`
        UPDATE contract_emails 
        SET status = 'failed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [emailId]);

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async scheduleReminders(emailId, reminderDates) {
    try {
      for (const reminder of reminderDates) {
        await db.query(`
          INSERT INTO email_reminders (email_id, reminder_date, reminder_message)
          VALUES ($1, $2, $3)
        `, [emailId, reminder.date, reminder.message]);
      }
    } catch (error) {
      throw new Error(`Failed to schedule reminders: ${error.message}`);
    }
  }

  async checkScheduledEmails() {
    try {
      const now = new Date();
      const scheduledEmails = await db.query(`
        SELECT id FROM contract_emails 
        WHERE status = 'scheduled' 
        AND scheduled_send_at <= $1
      `, [now]);

      for (const email of scheduledEmails.rows) {
        try {
          await this.sendEmail(email.id);
          console.log(`📤 Scheduled email ${email.id} sent successfully`);
        } catch (error) {
          console.error(`❌ Failed to send scheduled email ${email.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking scheduled emails:', error);
    }
  }

  async checkContractsDueSoon() {
    try {
      const today = new Date();
      const queries = [
        { days: 90, column: 'notification_90_sent' },
        { days: 30, column: 'notification_30_sent' },
        { days: 7, column: 'notification_7_sent' }
      ];

      for (const { days, column } of queries) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);

        const query = `
          SELECT c.*, u.email, u.name as user_name
          FROM contracts c
          JOIN users u ON c.user_id = u.id
          WHERE c.end_date = $1 
          AND c.${column} = FALSE
          AND u.email_notifications = TRUE
          AND c.end_date IS NOT NULL
        `;

        const { rows } = await db.query(query, [targetDate.toISOString().split('T')[0]]);
        
        for (const contract of rows) {
          await this.sendDueNotification(contract, days);
          await this.markNotificationSent(contract.id, column);
        }
      }
    } catch (error) {
      console.error('Error checking contracts due soon:', error);
    }
  }

  async sendDueNotification(contract, daysUntilDue) {
    try {
      const emailTemplate = this.getDueNotificationTemplate(contract, daysUntilDue);
      
      // Save notification email to database
      const emailData = {
        contractId: contract.id,
        userId: contract.user_id || 1, // Default to admin if no user_id
        to: contract.email,
        subject: emailTemplate.subject,
        body: emailTemplate.text,
        bodyHtml: emailTemplate.html,
        emailType: 'auto_reminder',
        priority: daysUntilDue <= 7 ? 'urgent' : daysUntilDue <= 30 ? 'high' : 'normal'
      };

      const savedEmail = await this.saveEmailDraft(emailData);
      await this.sendEmail(savedEmail.id);

      console.log(`✅ Due notification sent to ${contract.email} for contract ${contract.contract_name} (${daysUntilDue} days)`);
    } catch (error) {
      console.error(`❌ Failed to send due notification:`, error);
    }
  }

  async markNotificationSent(contractId, column) {
    try {
      await db.query(`
        UPDATE contracts 
        SET ${column} = TRUE, last_notification_date = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [contractId]);
    } catch (error) {
      console.error(`Failed to mark notification sent for contract ${contractId}:`, error);
    }
  }

  replaceTemplateVariables(template, data) {
    return template
      .replace(/{{contract_name}}/g, data.contract_name || '')
      .replace(/{{contract_number}}/g, data.contract_number || '')
      .replace(/{{vendor}}/g, data.vendor || '')
      .replace(/{{end_date}}/g, data.end_date ? new Date(data.end_date).toLocaleDateString() : '')
      .replace(/{{status}}/g, data.contract_status || data.status || '')
      .replace(/{{sender_name}}/g, data.sender_name || '')
      .replace(/{{recipient_name}}/g, 'Sir/Madam') // Could be enhanced to extract from email
      .replace(/{{days_until_due}}/g, data.days_until_due || '');
  }

  generateHtmlBody(textBody) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Contract Communication</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
              .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 20px; font-size: 12px; color: #999; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  ${textBody.split('\n').map(line => `<p>${line}</p>`).join('')}
              </div>
              <div class="footer">
                  <p>This email was sent via Contract Management System by IPM Team.</p>
                  <p>Please do not reply directly to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  getDueNotificationTemplate(contract, daysUntilDue) {
    const urgencyLevel = daysUntilDue <= 7 ? 'urgent' : daysUntilDue <= 30 ? 'warning' : 'info';
    const urgencyColor = urgencyLevel === 'urgent' ? '#dc2626' : urgencyLevel === 'warning' ? '#ea580c' : '#0369a1';
    
    const subject = `Contract Due in ${daysUntilDue} Days: ${contract.contract_name}`;
    const text = `Dear ${contract.user_name || 'Sir/Madam'},

This is a reminder that your contract "${contract.contract_name}" is due for renewal in ${daysUntilDue} days.

Contract Details:
- Contract Name: ${contract.contract_name}
- Contract Number: ${contract.contract_number}
- Due Date: ${new Date(contract.end_date).toLocaleDateString()}
- Status: ${contract.status || 'Active'}
- Vendor: ${contract.vendor || 'N/A'}

Please take action to renew or update this contract before the due date to avoid any service interruptions.

Best regards,
Contract Management Team`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Contract Due Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">Contract Due Notification</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
                  <p>Hello <strong>${contract.user_name || 'Sir/Madam'}</strong>,</p>
                  
                  <p>This is a reminder that your contract is due for renewal in <strong>${daysUntilDue} days</strong>.</p>
                  
                  <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <h3 style="margin-top: 0; color: ${urgencyColor};">Contract Details</h3>
                      <p><strong>Contract Name:</strong> ${contract.contract_name}</p>
                      <p><strong>Contract Number:</strong> ${contract.contract_number}</p>
                      <p><strong>Due Date:</strong> ${new Date(contract.end_date).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> ${contract.status || 'Active'}</p>
                      <p><strong>Vendor:</strong> ${contract.vendor || 'N/A'}</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contracts/${contract.id}" 
                         style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                          View Contract Details
                      </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                      Please take action to renew or update this contract before the due date to avoid any service interruptions.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                  <p style="font-size: 12px; color: #999;">
                      This is an automated notification from the Contract Management System.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;

    return { subject, text, html };
  }
}

module.exports = new EmailService();
