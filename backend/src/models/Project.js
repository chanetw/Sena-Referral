import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

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
    type: DataTypes.STRING(255)
  },
  priceRangeMin: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'price_range_min'
  },
  priceRangeMax: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'price_range_max'
  },
  salesTeam: {
    type: DataTypes.STRING(50),
    field: 'sales_team'
  },
  description: {
    type: DataTypes.TEXT
  },
  features: {
    type: DataTypes.JSON
  },
  images: {
    type: DataTypes.JSON
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  launchDate: {
    type: DataTypes.DATEONLY,
    field: 'launch_date'
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    field: 'completion_date'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Scopes
Project.addScope('active', {
  where: {
    isActive: true
  }
});

Project.addScope('byType', (type) => ({
  where: {
    projectType: type,
    isActive: true
  }
}));

export default Project;