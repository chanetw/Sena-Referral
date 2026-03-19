import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Agent = sequelize.define('Agent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
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
  idCard: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,
    field: 'id_card',
    validate: {
      len: [13, 13]
    }
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
    validate: {
      len: [10, 15]
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'registration_date'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active'
  },
  bankAccount: {
    type: DataTypes.STRING(50),
    field: 'bank_account'
  },
  bankName: {
    type: DataTypes.STRING(100),
    field: 'bank_name'
  },
  taxId: {
    type: DataTypes.STRING(13),
    field: 'tax_id'
  }
}, {
  tableName: 'agents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Virtual fields
Agent.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Scopes
Agent.addScope('active', {
  where: {
    status: 'active'
  }
});

export default Agent;