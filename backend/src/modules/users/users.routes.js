const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const requireAdmin = require('../../middlewares/requireAdmin');

// All user management routes require admin privileges
router.use(requireAdmin);

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
