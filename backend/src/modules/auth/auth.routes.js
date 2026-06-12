const express = require('express');
const router = express.Router();
const { loginUser, setupAdmin, checkSetupStatus } = require('./auth.controller');

router.post('/login', loginUser);
router.post('/setup', setupAdmin);
router.get('/setup/status', checkSetupStatus);

module.exports = router;
