# 📧 Email Management System Documentation

## Overview
The Email Management System provides comprehensive email functionality for contract management, including automated notifications, manual email composition, template management, and scheduled sending capabilities.

## 🏗️ Architecture

### Components
- **Email Service** (`services/email.service.js`) - Core email functionality
- **Email Controller** (`emails/email.controller.js`) - API endpoints handler
- **Email Routes** (`emails/email.routes.js`) - Route definitions
- **Email Scheduler** (`scheduler/email-scheduler.js`) - Automated tasks
- **Email Validation** (`emails/email.validation.js`) - Input validation

### Database Schema
The system uses the following tables:
- `contract_emails` - Email records
- `email_attachments` - File attachments
- `email_templates` - Email templates
- `email_reminders` - Scheduled reminders

## 🚀 Features

### 📝 Email Composition
- Rich text email composition
- File attachments support
- Contract document linking
- Email templates
- Priority levels (low, normal, high, urgent)
- Scheduled sending

### 🔔 Automated Notifications
- Contract due date reminders (90, 30, 7 days)
- Automatic email scheduling
- Follow-up reminders
- User notification preferences

### 📊 Email Management
- Email history tracking
- Draft management
- Email statistics
- Template management
- Bulk operations

## 📚 API Endpoints

### Email Management
```
POST   /api/emails/send                     - Send/schedule email
GET    /api/emails/history/contract/:id     - Get contract email history  
GET    /api/emails/history                  - Get all email history
GET    /api/emails/:emailId                 - Get email by ID
PUT    /api/emails/:emailId                 - Update email (drafts only)
DELETE /api/emails/:emailId                 - Delete email
```

### Templates
```
GET    /api/emails/templates                - Get email templates
POST   /api/emails/templates                - Create email template
```

### Contract Notifications
```
GET    /api/emails/contracts/due-soon       - Get contracts due soon
POST   /api/emails/contracts/:id/due-reminder - Send due reminder
```

### User Preferences
```
PUT    /api/emails/preferences              - Update notification preferences
GET    /api/emails/stats                    - Get email statistics
```

## 🔧 Configuration

### Environment Variables
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourcompany.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

### SMTP Setup
1. **Gmail Setup**:
   - Enable 2-factor authentication
   - Generate app password
   - Use app password as SMTP_PASS

2. **Other Providers**:
   - Update SMTP_HOST and SMTP_PORT
   - Configure authentication credentials

## 📤 Email Sending

### Manual Email
```javascript
// Example: Send manual email
const emailData = {
  contractId: 5,
  to: 'recipient@example.com',
  subject: 'Contract Discussion',
  body: 'Email content here...',
  action: 'send'
};

fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(emailData)
});
```

### Scheduled Email
```javascript
// Example: Schedule email
const emailData = {
  contractId: 5,
  to: 'recipient@example.com',
  subject: 'Scheduled Reminder',
  body: 'This email was scheduled...',
  scheduledSendAt: '2024-12-25T09:00:00Z',
  action: 'schedule'
};
```

### File Attachments
```javascript
// Example: Email with attachments
const formData = new FormData();
formData.append('contractId', '5');
formData.append('to', 'recipient@example.com');
formData.append('subject', 'Contract Documents');
formData.append('body', 'Please find attached documents.');
formData.append('attachments', file1);
formData.append('attachments', file2);
formData.append('action', 'send');

fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

## 🎨 Email Templates

### Template Variables
Available variables for templates:
- `{{contract_name}}` - Contract name
- `{{contract_number}}` - Contract number  
- `{{vendor}}` - Vendor name
- `{{end_date}}` - Contract end date
- `{{status}}` - Contract status
- `{{sender_name}}` - Sender name
- `{{recipient_name}}` - Recipient name
- `{{days_until_due}}` - Days until due

### Default Templates
1. **Contract Due Reminder** - For due date notifications
2. **Contract Renewal Notice** - For renewal requests
3. **Follow-up Email** - For general follow-ups

### Custom Templates
```javascript
// Example: Create custom template
const template = {
  name: 'Payment Reminder',
  subjectTemplate: 'Payment Due: {{contract_name}}',
  bodyTemplate: `Dear {{recipient_name}},
  
This is a reminder that payment for {{contract_name}} is due.
  
Amount: {{amount}}
Due Date: {{due_date}}
  
Best regards,
{{sender_name}}`,
  templateType: 'custom'
};

fetch('/api/emails/templates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(template)
});
```

## ⏰ Automated Scheduling

### Cron Jobs
- **Hourly**: Check for scheduled emails
- **Daily 9 AM**: Check contract due dates
- **Daily 10 AM**: Process email reminders

### Contract Due Notifications
Automatic notifications are sent:
- 90 days before expiry
- 30 days before expiry  
- 7 days before expiry
- On expiry date

### User Preferences
Users can configure:
```javascript
{
  emailNotifications: true,
  notificationPreference: {
    "90_days": true,
    "30_days": true, 
    "7_days": true,
    "expired": true
  }
}
```

## 🔍 Email Tracking

### Status Tracking
- `draft` - Email saved but not sent
- `scheduled` - Email scheduled for future sending
- `sent` - Email successfully sent
- `failed` - Email sending failed

### Analytics
Available statistics:
- Total emails sent
- Draft emails
- Scheduled emails
- Failed emails
- Auto reminders sent
- Recent activity

## 🛡️ Security

### Authentication
All endpoints require JWT authentication:
```javascript
headers: {
  'Authorization': 'Bearer ' + jwtToken
}
```

### File Upload Security
- File type validation
- Size limits (10MB per file)
- Secure file storage
- Virus scanning (recommended)

### Data Protection
- User data isolation
- Secure email transmission
- Audit logging
- GDPR compliance ready

## 🧪 Testing

### Setup Testing
```bash
# Run database setup
node scripts/setup-email-system.js

# Test system functionality  
node scripts/test-email-system.js

# Test API endpoints
node scripts/test-email-api.js
```

### Manual Testing
1. Start the server: `npm start`
2. Test endpoints with Postman or curl
3. Verify email sending with SMTP credentials
4. Check database records

## 🚀 Deployment

### Production Setup
1. Configure production SMTP service
2. Set secure environment variables
3. Enable SSL/TLS for email security
4. Configure backup strategies
5. Set up monitoring and logging

### Scaling Considerations
- Email queue management
- Rate limiting for email sending
- Background job processing
- Email delivery monitoring
- Error handling and retry logic

## 📞 Support

### Common Issues
1. **SMTP Connection Errors**: Check credentials and network
2. **Authentication Failures**: Verify JWT token validity
3. **File Upload Issues**: Check file size and type restrictions
4. **Template Errors**: Validate template syntax

### Monitoring
Monitor these metrics:
- Email delivery rates
- Failed email attempts
- Queue processing times
- User engagement rates
- System resource usage

## 🔄 Future Enhancements

### Planned Features
- Email analytics dashboard
- Advanced template editor
- Bulk email operations
- Email campaigns
- Integration with calendar systems
- Mobile push notifications
- Email threading/conversations
- Advanced search and filtering
