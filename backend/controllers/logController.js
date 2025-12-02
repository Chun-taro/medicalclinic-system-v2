const Log = require('../models/Log');

const getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate('adminId', 'firstName lastName')
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({
      message: 'Logs retrieved successfully',
      logs: logs
    });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({
      message: 'Error retrieving logs',
      error: error.message
    });
  }
};

module.exports = {
  getLogs
};

