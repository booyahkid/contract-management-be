-- Email Management System Database Schema
-- Run this after the main schema.sql

-- Contract Email Management Tables
CREATE TABLE IF NOT EXISTS contract_emails (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email Details
    to_email VARCHAR(255) NOT NULL,
    cc_emails TEXT[], -- Array of CC emails
    bcc_emails TEXT[], -- Array of BCC emails
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT,
    
    -- Email Type & Status
    email_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'auto_reminder', 'due_notice'
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'failed', 'scheduled'
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Scheduling
    scheduled_send_at TIMESTAMP,
    sent_at TIMESTAMP,
    
    -- Tracking
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_attachments (
    id SERIAL PRIMARY KEY,
    email_id INTEGER REFERENCES contract_emails(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_contract_file BOOLEAN DEFAULT FALSE,
    contract_file_id INTEGER REFERENCES contract_files(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    subject_template VARCHAR(500) NOT NULL,
    body_template TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'due_reminder', 'renewal_notice'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_reminders (
    id SERIAL PRIMARY KEY,
    email_id INTEGER REFERENCES contract_emails(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    reminder_message TEXT,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add notification preferences to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notification_preference JSONB DEFAULT '{"90_days": true, "30_days": true, "7_days": true, "expired": true}'::jsonb;

-- Add notification tracking to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS notification_90_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_30_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_7_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_notification_date TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_emails_contract_id ON contract_emails(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_emails_user_id ON contract_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_emails_status ON contract_emails(status);
CREATE INDEX IF NOT EXISTS idx_contract_emails_scheduled ON contract_emails(scheduled_send_at) WHERE scheduled_send_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id ON email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_reminders_date ON email_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_notifications ON contracts(end_date, notification_90_sent, notification_30_sent, notification_7_sent);

-- Insert default email templates
INSERT INTO email_templates (user_id, name, subject_template, body_template, template_type) 
SELECT 4, 'Contract Due Reminder', 'Contract Due in {{days_until_due}} Days: {{contract_name}}', 
'Dear {{recipient_name}},

This is a reminder that the contract "{{contract_name}}" (Contract Number: {{contract_number}}) is due for renewal in {{days_until_due}} days.

Contract Details:
- Contract Name: {{contract_name}}
- Contract Number: {{contract_number}}
- Due Date: {{end_date}}
- Current Status: {{status}}
- Vendor: {{vendor}}

Please take the necessary action to renew or update this contract before the due date to avoid any service interruptions.

If you have any questions or need assistance, please don''t hesitate to contact us.

Best regards,
Contract Management Team', 'due_reminder'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 4)

UNION ALL

SELECT 4, 'Contract Renewal Notice', 'Contract Renewal Required: {{contract_name}}', 
'Dear {{recipient_name}},

We hope this email finds you well. We are writing to inform you that your contract with us is approaching its renewal date.

Contract Information:
- Contract Name: {{contract_name}}
- Contract Number: {{contract_number}}
- Current End Date: {{end_date}}
- Vendor: {{vendor}}

To ensure uninterrupted service, please review the contract terms and let us know if you wish to renew or make any modifications.

We value our partnership and look forward to continuing our business relationship.

Best regards,
Contract Management Team', 'renewal_notice'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 4)

UNION ALL

SELECT 4, 'Follow-up Email', 'Follow-up: {{contract_name}}', 
'Dear {{recipient_name}},

I hope this email finds you well. I am following up on our previous communication regarding the contract "{{contract_name}}".

Contract Details:
- Contract Name: {{contract_name}}
- Contract Number: {{contract_number}}
- Status: {{status}}

Please let me know if you need any additional information or if there are any updates on your end.

Thank you for your time and attention.

Best regards,
{{sender_name}}', 'custom'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 4);
