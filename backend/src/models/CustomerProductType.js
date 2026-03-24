import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CustomerProductType = sequelize.define('CustomerProductType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'customer_id'
  },
  productTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_type_id'
  }
}, {
  tableName: 'customer_product_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['customer_id', 'product_type_id']
    }
  ]
});

export default CustomerProductType;
