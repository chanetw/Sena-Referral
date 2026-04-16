const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settingKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'setting_key'
  },
  settingValue: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'setting_value'
  },
  settingType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string',
    field: 'setting_type'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SystemSetting;
