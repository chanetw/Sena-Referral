const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'project_code'
  },
  projectName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'project_name'
  },
  projectType: {
    type: DataTypes.ENUM('condo', 'house', 'townhome', 'commercial'),
    allowNull: false,
    field: 'project_type'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  priceRangeMin: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'price_range_min'
  },
  priceRangeMax: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'price_range_max'
  },
  salesTeam: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'sales_team'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Project.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  return values;
};

module.exports = Project;