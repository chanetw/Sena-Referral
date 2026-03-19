import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

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
  idCard: {
    type: DataTypes.STRING(13),
    field: 'id_card',
    validate: {
      len: [13, 13]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true
    }
  },
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  budgetMin: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'budget_min'
  },
  budgetMax: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'budget_max'
  },
  status: {
    type: DataTypes.ENUM('pending', 'duplicate', 'approved'),
    defaultValue: 'pending'
  },
  source: {
    type: DataTypes.ENUM('referral', 'walk_in', 'online', 'phone', 'other'),
    defaultValue: 'referral'
  },
  notes: {
    type: DataTypes.TEXT
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_duplicate'
  },
  duplicateCustomerId: {
    type: DataTypes.INTEGER,
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
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
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

Customer.prototype.getBudgetRange = function() {
  if (this.budgetMin && this.budgetMax) {
    return `${this.budgetMin.toLocaleString()} - ${this.budgetMax.toLocaleString()}`;
  }
  return 'ไม่ระบุ';
};

// Scopes
Customer.addScope('active', {
  where: {
    status: {
      [sequelize.Sequelize.Op.notIn]: ['closed_lost']
    }
  }
});

Customer.addScope('byAgent', (agentId) => ({
  where: {
    agentId: agentId
  }
}));

Customer.addScope('byStatus', (status) => ({
  where: {
    status: status
  }
}));

Customer.addScope('approved', {
  where: {
    senaApproved: true
  }
});

export default Customer;