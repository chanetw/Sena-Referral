const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentType = sequelize.define('AgentType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  nameTh: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'name_th'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order'
  }
}, {
  tableName: 'agent_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AgentType;
