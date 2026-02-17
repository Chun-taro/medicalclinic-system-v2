const express = require('express');
const router = express.Router();
const { getVersions, sendTestEmail } = require('../controllers/systemController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/versions', getVersions);
// TODO: Revert this to secure endpoint after testing
router.get('/test-email', sendTestEmail);

module.exports = router;
