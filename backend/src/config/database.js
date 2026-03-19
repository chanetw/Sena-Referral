const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'referral_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timezone: '+07:00', // Bangkok timezone
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// Set charset immediately after sequelize initialization
(async () => {
  try {
    await sequelize.query("SET NAMES 'utf8mb4'");
    await sequelize.query("SET CHARACTER SET utf8mb4");
    await sequelize.query("SET character_set_connection=utf8mb4");
  } catch (error) {
    // Will try again in testConnection
  }
})();

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query("SET NAMES 'utf8mb4'");
    await sequelize.query("SET CHARACTER SET utf8mb4");
    await sequelize.query("SET character_set_connection=utf8mb4");
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
