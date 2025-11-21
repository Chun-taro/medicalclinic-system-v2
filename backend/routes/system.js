const express = require('express');
const router = express.Router();
const { getVersions } = require('../controllers/systemController');

router.get('/versions', getVersions);

module.exports = router;
