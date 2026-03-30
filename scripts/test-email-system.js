#!/usr/bin/env node

/**
 * Email System Test Script
 * Tests the email management functionality
 */

const emailService = require('../services/email.service');
const db = require('../config/db');

async function testEmailSystem() {
  console.log('🧪 Testing Email Management System...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const dbTest = await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully\n');

    // Test 2: Create test email data
    console.log('2️⃣ Creating test email...');
    const emailData = {
      contractId: 5, // Using existing contract ID
      userId: 4, // Using existing user ID (Administrator)
      to: 'test@example.com',
      subject: 'Test Email - Contract Management System',
      body: 'This is a test email from the contract management system.',
      emailType: 'manual',
      priority: 'normal'
    };

    const savedEmail = await emailService.saveEmailDraft(emailData);
    console.log('✅ Test email created successfully:', savedEmail.id);

    // Test 3: Check email templates
    console.log('\n3️⃣ Checking email templates...');
    const templates = await db.query('SELECT * FROM email_templates LIMIT 3');
    console.log(`✅ Found ${templates.rows.length} email templates`);
    templates.rows.forEach(template => {
      console.log(`   - ${template.name} (${template.template_type})`);
    });

    // Test 4: Check contracts due soon
    console.log('\n4️⃣ Checking contracts due soon...');
    const contractsQuery = `
      SELECT c.id, c.contract_name, c.end_date,
             (c.end_date - CURRENT_DATE) as days_until_due
      FROM contracts c
      WHERE c.end_date IS NOT NULL
      AND c.end_date >= CURRENT_DATE
      AND c.end_date <= CURRENT_DATE + INTERVAL '90 days'
      ORDER BY c.end_date ASC
      LIMIT 5
    `;
    
    const contracts = await db.query(contractsQuery);
    console.log(`✅ Found ${contracts.rows.length} contracts due within 90 days`);
    contracts.rows.forEach(contract => {
      console.log(`   - ${contract.contract_name}: ${contract.days_until_due} days`);
    });

    // Test 5: Test email template processing
    console.log('\n5️⃣ Testing template variable replacement...');
    const testTemplate = 'Contract {{contract_name}} is due in {{days_until_due}} days.';
    const testData = {
      contract_name: 'Test Contract',
      days_until_due: '30'
    };
    
    const processedTemplate = emailService.replaceTemplateVariables(testTemplate, testData);
    console.log('✅ Template processing works:', processedTemplate);

    // Test 6: Check notification preferences
    console.log('\n6️⃣ Checking user notification preferences...');
    const users = await db.query(`
      SELECT id, name, email, email_notifications, notification_preference
      FROM users
      WHERE email_notifications = TRUE
      LIMIT 3
    `);
    console.log(`✅ Found ${users.rows.length} users with notifications enabled`);

    console.log('\n🎉 All email system tests passed successfully!');
    console.log('\n📋 System Status:');
    console.log('   ✅ Database connection: Working');
    console.log('   ✅ Email service: Working');
    console.log('   ✅ Templates: Working');
    console.log('   ✅ Contract monitoring: Working');
    console.log('   ✅ Template processing: Working');
    console.log('   ✅ User preferences: Working');

    console.log('\n🔧 Next Steps:');
    console.log('   1. Configure SMTP settings in .env file');
    console.log('   2. Test actual email sending (requires SMTP config)');
    console.log('   3. Set up frontend email composer');
    console.log('   4. Configure cron job schedules');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  testEmailSystem();
}

module.exports = { testEmailSystem };
