const express = require('express');
const router = express.Router();

const { getLogs } = require('../controllers/logController');
const { auth } = require('../middleware/auth');

// Get all logs (superadmin only)
router.get('/', auth, getLogs);

module.exports = router;
