import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AgentTypeDetail = sequelize.define('AgentTypeDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'agent_id'
  },
  referralCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    field: 'referral_code'
  },
  houseNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    field: 'house_number'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    field: 'project_id'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  division: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  companyName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
    field: 'company_name'
  },
  occupation: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null
  },
  knowSenaFrom: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: null,
    field: 'know_sena_from'
  }
}, {
  tableName: 'agent_type_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AgentTypeDetail;
