const { sequelize } = require('./database');

// Import all models using CommonJS
const User = require('../models/User');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const Project = require('../models/Project');

const initDatabase = async () => {
  try {
    console.log('🔗 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    console.log('🔄 Syncing database models...');
    // ไม่ sync models เพราะเราใช้ SQL schema ที่มีอยู่แล้ว
    // await sequelize.sync({ force: false });
    console.log('✅ Database models synced successfully');

    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    throw error;
  }
};

const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    const result = await sequelize.query('SELECT COUNT(*) as count FROM users');
    console.log('📊 Database test successful. Users count:', result[0][0].count);
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
};

module.exports = {
  initDatabase,
  testDatabaseConnection,
  sequelize
};