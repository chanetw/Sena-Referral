import { Customer, Agent, User, Project } from '../models/index.js';
import { Op } from 'sequelize';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin/Manager
export const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, agentId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (agentId && agentId !== 'all') {
      whereClause.agentId = agentId;
    }

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'agentCode', 'firstName', 'lastName'],
        },
        {
          model: Project,
          as: 'project',
          attributes: ['projectName'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    const customers = rows.map(customer => {
      const plainCustomer = customer.get({ plain: true });


      return {
        ...plainCustomer,
        projectName: plainCustomer.project?.projectName,
        budget: (parseFloat(plainCustomer.budgetMin) + parseFloat(plainCustomer.budgetMax)) / 2,
        createdAt: plainCustomer.createdAt || plainCustomer.created_at,
        updatedAt: plainCustomer.updatedAt || plainCustomer.updated_at,
      };
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Customers fetched successfully',
      data: customers,
      pagination: {
        total: count,
        current: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message,
    });
  }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private/Admin/Manager
export const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message,
    });
  }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private/Admin/Manager
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Customer.update(req.body, {
      where: { id: id },
    });

    if (updated) {
      const updatedCustomer = await Customer.findByPk(id);
      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: updatedCustomer,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message,
    });
  }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin/Manager
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Customer.destroy({
      where: { id: id },
    });

    if (deleted) {
      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message,
    });
  }
};
