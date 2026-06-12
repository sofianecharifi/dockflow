const express = require('express');
const router = express.Router();
const { loginUser, setupAdmin, checkSetupStatus, logoutUser } = require('./auth.controller');

router.post('/login', loginUser);
router.post('/setup', setupAdmin);
router.get('/setup/status', checkSetupStatus);
router.post('/logout', logoutUser);

module.exports = router;
