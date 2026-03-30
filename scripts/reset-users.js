const bcrypt = require('bcrypt');
const db = require('../config/db');

async function resetUsers() {
  try {
    console.log('🗑️  Deleting existing users...');
    
    // Delete all users
    await db.query('DELETE FROM users WHERE id > 0');
    
    console.log('✅ All users deleted successfully');
    
    console.log('👥 Creating new dummy accounts...');
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    
    // Create new dummy users
    const users = [
      {
        name: 'Administrator',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin'
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: staffPassword,
        role: 'staff'
      },
      {
        name: 'Bob Manager',
        email: 'bob@example.com',
        password: managerPassword,
        role: 'manager'
      },
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: userPassword,
        role: 'user'
      },
      {
        name: 'David Wilson',
        email: 'david@example.com',
        password: staffPassword,
        role: 'staff'
      }
    ];
    
    // Insert new users
    for (const user of users) {
      const result = await db.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role
      `, [user.name, user.email, user.password, user.role]);
      
      console.log(`✅ Created user: ${result.rows[0].name} (${result.rows[0].email}) - Role: ${result.rows[0].role}`);
    }
    
    console.log('\n🎉 User reset completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('┌────────────────────┬─────────────────────┬──────────────┬──────────┐');
    console.log('│ Name               │ Email               │ Password     │ Role     │');
    console.log('├────────────────────┼─────────────────────┼──────────────┼──────────┤');
    console.log('│ Administrator      │ admin@example.com   │ admin123     │ admin    │');
    console.log('│ John Doe           │ john@example.com    │ user123      │ user     │');
    console.log('│ Jane Smith         │ jane@example.com    │ staff123     │ staff    │');
    console.log('│ Bob Manager        │ bob@example.com     │ manager123   │ manager  │');
    console.log('│ Alice Johnson      │ alice@example.com   │ user123      │ user     │');
    console.log('│ David Wilson       │ david@example.com   │ staff123     │ staff    │');
    console.log('└────────────────────┴─────────────────────┴──────────────┴──────────┘');
    
  } catch (error) {
    console.error('❌ Error resetting users:', error);
  } finally {
    await db.end();
  }
}

// Run the script
resetUsers();
