import { sequelize } from '../config/database.js';
import User from './User.js';
import Agent from './Agent.js';
import AgentType from './AgentType.js';
import Project from './Project.js';
import Customer from './Customer.js';

// Define associations
// User - Agent (One to One)
User.hasOne(Agent, {
  foreignKey: 'userId',
  as: 'agent'
});
Agent.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Agent Type - Agent (One to Many)
AgentType.hasMany(Agent, {
  foreignKey: 'agentTypeId',
  as: 'agents'
});
Agent.belongsTo(AgentType, {
  foreignKey: 'agentTypeId',
  as: 'agentType'
});

// Agent - Customer (One to Many)
Agent.hasMany(Customer, {
  foreignKey: 'agentId',
  as: 'customers'
});
Customer.belongsTo(Agent, {
  foreignKey: 'agentId',
  as: 'agent'
});

// Project - Customer (One to Many)
Project.hasMany(Customer, {
  foreignKey: 'projectId',
  as: 'customers'
});
Customer.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

// Customer - Customer (Self reference for duplicates)
Customer.belongsTo(Customer, {
  foreignKey: 'duplicateCustomerId',
  as: 'duplicateOf'
});
Customer.hasMany(Customer, {
  foreignKey: 'duplicateCustomerId',
  as: 'duplicates'
});

// User audit fields for Customer
User.hasMany(Customer, {
  foreignKey: 'createdBy',
  as: 'createdCustomers'
});
Customer.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Customer, {
  foreignKey: 'updatedBy',
  as: 'updatedCustomers'
});
Customer.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater'
});

User.hasMany(Customer, {
  foreignKey: 'approvedBy',
  as: 'approvedCustomers'
});
Customer.belongsTo(User, {
  foreignKey: 'approvedBy',
  as: 'approver'
});

// Export all models
export {
  sequelize,
  User,
  Agent,
  AgentType,
  Project,
  Customer
};

// Sync function for development
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};