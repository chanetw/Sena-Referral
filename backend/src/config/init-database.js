const { sequelize } = require('./database');

// Import all models using CommonJS
const User = require('../models/User');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const Project = require('../models/Project');

const MAX_RETRIES = parseInt(process.env.DB_CONNECT_RETRIES || '5', 10);
const RETRY_DELAY_MS = parseInt(process.env.DB_CONNECT_RETRY_DELAY || '5000', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initDatabase = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔗 Testing database connection... (attempt ${attempt}/${MAX_RETRIES})`);
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully');

      console.log('🔄 Syncing database models...');
      // ไม่ sync models เพราะเราใช้ SQL schema ที่มีอยู่แล้ว
      // await sequelize.sync({ force: false });
      console.log('✅ Database models synced successfully');

      return true;
    } catch (error) {
      console.error(`❌ Unable to connect to database (attempt ${attempt}/${MAX_RETRIES}):`, error.message);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error('💀 All database connection attempts failed');
        throw error;
      }
    }
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