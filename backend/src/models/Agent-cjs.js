const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  agentTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'agent_type_id',
    references: {
      model: 'agent_types',
      key: 'id'
    }
  },
  agentCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'agent_code'
  },
  refCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: true,
    field: 'ref_code'
  },
  agentIdCard: {
    type: DataTypes.STRING(13),
    allowNull: true,
    field: 'agent_id_card'
  },
  idCard: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,
    field: 'id_card'
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name'
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'registration_date'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'email'
  },
  duplicateLeadId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'duplicate_lead_id'
  }
}, {
  tableName: 'agents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Agent.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

Agent.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

module.exports = Agent;