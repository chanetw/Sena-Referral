const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'agent_id',
    references: {
      model: 'agents',
      key: 'id'
    }
  },
  customerCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    field: 'customer_code'
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
  idCard: {
    type: DataTypes.STRING(13),
    allowNull: true,
    field: 'id_card'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  budgetMin: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'budget_min'
  },
  budgetMax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'budget_max'
  },
  status: {
    type: DataTypes.ENUM('pending', 'duplicate', 'approved'),
    defaultValue: 'pending'
  },
  referralType: {
    type: DataTypes.ENUM('self', 'friend'),
    allowNull: true,
    field: 'referral_type',
    comment: 'ประเภทลูกค้า: self=แนะนำตัวเอง, friend=แนะนำเพื่อน'
  },
  source: {
    type: DataTypes.ENUM('referral', 'walk_in', 'online', 'phone', 'other'),
    defaultValue: 'referral'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_duplicate'
  },
  duplicateCustomerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'duplicate_customer_id',
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  senaApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'sena_approved'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'registration_date'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Customer.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

Customer.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

// Define associations
Customer.associate = function(models) {
  Customer.belongsTo(models.Agent, {
    foreignKey: 'agentId',
    as: 'agent'
  });

  Customer.belongsTo(models.Project, {
    foreignKey: 'projectId',
    as: 'project'
  });
};

module.exports = Customer;