const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const requireAuth = require('../../middlewares/requireAuth');

router.get('/setup/status', authController.checkSetupStatus);
router.post('/setup', authController.setupAdmin);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);
router.post('/refresh', authController.refreshToken);

// Profile routes
router.get('/me', requireAuth, authController.getMe);
router.put('/profile', requireAuth, authController.updateProfile);
router.put('/password', requireAuth, authController.changePassword);
router.delete('/me', requireAuth, authController.deleteAccount);

module.exports = router;
