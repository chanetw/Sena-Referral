const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetAdminPassword() {
  try {
    // เชื่อมต่อฐานข้อมูล
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'sena_user',
      password: 'sena_password',
      database: 'sena_referral'
    });

    // Hash password ใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password', salt);

    // สร้าง admin user ใหม่
    await connection.execute(
      'INSERT INTO users (email, password, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      ['admin@test.com', hashedPassword, 'admin', 1]
    );

    console.log('✅ Admin user has been created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: password');

    await connection.end();
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  }
}

resetAdminPassword();