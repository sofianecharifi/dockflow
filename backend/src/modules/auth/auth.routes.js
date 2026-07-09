const express = require('express');
const router = express.Router();
const { loginUser, setupAdmin, checkSetupStatus, logoutUser, getMe, updateProfile, changePassword } = require('./auth.controller');
const requireAuth = require('../../middlewares/requireAuth');

router.post('/login', loginUser);
router.post('/setup', setupAdmin);
router.get('/setup/status', checkSetupStatus);
router.post('/logout', logoutUser);

// Profile routes
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, changePassword);

module.exports = router;
