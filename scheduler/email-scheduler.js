const cron = require('node-cron');
const emailService = require('../services/email.service');

class EmailScheduler {
  constructor() {
    this.initializeSchedules();
  }

  initializeSchedules() {
    // Check for scheduled emails every hour
    cron.schedule('0 * * * *', async () => {
      console.log('🔄 Checking scheduled emails...');
      try {
        await emailService.checkScheduledEmails();
      } catch (error) {
        console.error('Error in scheduled email check:', error);
      }
    });

    // Check for contract due dates every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily contract due date check...');
      try {
        await emailService.checkContractsDueSoon();
        console.log('✅ Contract notification check completed');
      } catch (error) {
        console.error('❌ Error in contract notification check:', error);
      }
    }, {
      timezone: "Asia/Jakarta" // Adjust to your timezone
    });

    // Check for pending reminders every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('🔔 Checking pending email reminders...');
      try {
        await this.checkPendingReminders();
      } catch (error) {
        console.error('Error checking pending reminders:', error);
      }
    });

    console.log('📅 Email scheduler initialized with the following tasks:');
    console.log('   - Scheduled emails: Every hour');
    console.log('   - Contract due dates: Daily at 9:00 AM');
    console.log('   - Email reminders: Daily at 10:00 AM');
  }

  async checkPendingReminders() {
    try {
      const db = require('../config/db');
      const today = new Date().toISOString().split('T')[0];

      // Get pending reminders for today
      const { rows } = await db.query(`
        SELECT er.*, ce.contract_id, ce.user_id, ce.to_email, ce.subject, ce.body_text,
               c.contract_name, c.contract_number
        FROM email_reminders er
        JOIN contract_emails ce ON er.email_id = ce.id
        JOIN contracts c ON ce.contract_id = c.id
        WHERE er.reminder_date <= $1 
        AND er.is_sent = FALSE
      `, [today]);

      for (const reminder of rows) {
        try {
          // Create follow-up email
          const followUpEmailData = {
            contractId: reminder.contract_id,
            userId: reminder.user_id,
            to: reminder.to_email,
            subject: `Follow-up: ${reminder.subject}`,
            body: reminder.reminder_message || `This is a follow-up regarding the contract "${reminder.contract_name}".`,
            emailType: 'auto_reminder',
            priority: 'normal'
          };

          const savedEmail = await emailService.saveEmailDraft(followUpEmailData);
          await emailService.sendEmail(savedEmail.id);

          // Mark reminder as sent
          await db.query(`
            UPDATE email_reminders 
            SET is_sent = TRUE, sent_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [reminder.id]);

          console.log(`✅ Reminder sent for contract ${reminder.contract_name}`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for contract ${reminder.contract_name}:`, error);
        }
      }

      if (rows.length > 0) {
        console.log(`📧 Processed ${rows.length} pending reminders`);
      }
    } catch (error) {
      console.error('Error in checkPendingReminders:', error);
    }
  }

  // Manual trigger for testing
  async triggerContractCheck() {
    console.log('🔄 Manually triggering contract due date check...');
    await emailService.checkContractsDueSoon();
  }

  async triggerScheduledEmailCheck() {
    console.log('🔄 Manually triggering scheduled email check...');
    await emailService.checkScheduledEmails();
  }

  async triggerReminderCheck() {
    console.log('🔄 Manually triggering reminder check...');
    await this.checkPendingReminders();
  }
}

module.exports = new EmailScheduler();
