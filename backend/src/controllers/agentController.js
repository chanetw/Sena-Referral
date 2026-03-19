import { Agent, User } from '../models/index.js';
import { Op } from 'sequelize';

// @desc    Get all agents
// @route   GET /api/agents
// @access  Private/Admin/Manager
export const getAgents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    let userWhereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      userWhereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } }
      ];
      whereClause[Op.or] = [
        { agentCode: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Agent.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user', // Assuming the association is named 'user'
          attributes: ['email'], // Only fetch email from User model
          where: userWhereClause,
          required: search ? true : false // Only require user join if searching by user fields
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Agents fetched successfully',
      data: rows,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error.message
    });
  }
};
