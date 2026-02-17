const express = require('express');
const router = express.Router();
const { getVersions, sendTestEmail } = require('../controllers/systemController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/versions', getVersions);
router.get('/test-email', auth, requireRole('admin', 'superadmin'), sendTestEmail);

module.exports = router;
