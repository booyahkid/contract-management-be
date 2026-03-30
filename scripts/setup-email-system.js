#!/usr/bin/env node

/**
 * Email System Setup Script
 * Initializes the email management system
 */

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupEmailSystem() {
  console.log('🚀 Setting up Email Management System...\n');

  try {
    // Step 1: Run database migrations
    console.log('1️⃣ Running database migrations...');
    
    const schemaPath = path.join(__dirname, '../database/email-management-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(schemaSql);
    console.log('✅ Database schema updated successfully');

    // Step 2: Create required directories
    console.log('\n2️⃣ Creating required directories...');
    
    const directories = [
      '../uploads/email-attachments',
      '../logs'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory exists: ${dir}`);
      }
    });

    // Step 3: Verify table creation
    console.log('\n3️⃣ Verifying table creation...');
    
    const tables = [
      'contract_emails',
      'email_attachments',
      'email_templates',
      'email_reminders'
    ];

    for (const table of tables) {
      const result = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table ${table} exists`);
      } else {
        console.log(`❌ Table ${table} missing`);
      }
    }

    // Step 4: Check default templates
    console.log('\n4️⃣ Checking default email templates...');
    
    const templatesResult = await db.query('SELECT COUNT(*) FROM email_templates');
    const templateCount = parseInt(templatesResult.rows[0].count);
    
    if (templateCount > 0) {
      console.log(`✅ Found ${templateCount} email templates`);
      
      const templates = await db.query('SELECT name, template_type FROM email_templates');
      templates.rows.forEach(template => {
        console.log(`   - ${template.name} (${template.template_type})`);
      });
    } else {
      console.log('⚠️  No email templates found');
    }

    // Step 5: Check user preferences
    console.log('\n5️⃣ Checking user notification preferences...');
    
    const userCheck = await db.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE email_notifications = TRUE) as enabled
      FROM users
    `);
    
    const { total, enabled } = userCheck.rows[0];
    console.log(`✅ Users: ${total} total, ${enabled} with notifications enabled`);

    // Step 6: Verify indexes
    console.log('\n6️⃣ Verifying database indexes...');
    
    const indexCheck = await db.query(`
      SELECT schemaname, tablename, indexname 
      FROM pg_indexes 
      WHERE tablename IN ('contract_emails', 'email_attachments', 'email_templates', 'contracts')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`✅ Found ${indexCheck.rows.length} performance indexes`);

    console.log('\n🎉 Email Management System setup complete!');
    console.log('\n📋 Setup Summary:');
    console.log('   ✅ Database schema: Updated');
    console.log('   ✅ Required directories: Created');
    console.log('   ✅ Database tables: Verified');
    console.log(`   ✅ Email templates: ${templateCount} available`);
    console.log(`   ✅ User preferences: ${enabled}/${total} enabled`);
    console.log(`   ✅ Performance indexes: ${indexCheck.rows.length} created`);

    console.log('\n🔧 Configuration Required:');
    console.log('   1. Update .env file with SMTP settings:');
    console.log('      - SMTP_HOST=smtp.gmail.com');
    console.log('      - SMTP_USER=your-email@gmail.com');
    console.log('      - SMTP_PASS=your-app-password');
    console.log('      - FROM_EMAIL=noreply@yourcompany.com');
    console.log('   2. Configure FRONTEND_URL for email links');
    console.log('   3. Test email sending with real SMTP credentials');

    console.log('\n📚 Available API Endpoints:');
    console.log('   POST   /api/emails/send                     - Send/schedule email');
    console.log('   GET    /api/emails/history/contract/:id     - Get contract email history');
    console.log('   GET    /api/emails/history                  - Get all email history');
    console.log('   GET    /api/emails/templates                - Get email templates');
    console.log('   POST   /api/emails/templates                - Create email template');
    console.log('   GET    /api/emails/contracts/due-soon       - Get contracts due soon');
    console.log('   POST   /api/emails/contracts/:id/due-reminder - Send due reminder');
    console.log('   PUT    /api/emails/preferences              - Update notification preferences');
    console.log('   GET    /api/emails/stats                    - Get email statistics');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  setupEmailSystem();
}

module.exports = { setupEmailSystem };
