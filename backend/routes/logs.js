const express = require('express');
const router = express.Router();

const { getLogs } = require('../controllers/logController');
const { auth, requireRole } = require('../middleware/auth');

// Get all logs (superadmin only)
router.get('/', auth, requireRole('superadmin'), getLogs);

module.exports = router;
