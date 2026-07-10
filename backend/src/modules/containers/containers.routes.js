const express = require('express');
const router = express.Router();
const containerController = require('./containers.controller');
const requireAuth = require('../../middlewares/requireAuth');
const requireAdmin = require('../../middlewares/requireAdmin');

// list all containers
router.get('/', requireAuth, containerController.listContainers);

// container actions
router.post('/:id/start', requireAdmin, containerController.startContainer);
router.post('/:id/stop', requireAdmin, containerController.stopContainer);
router.post('/:id/restart', requireAdmin, containerController.restartContainer);
router.post('/:id/pull', requireAdmin, containerController.pullAndRecreateContainer);
router.delete('/:id', requireAdmin, containerController.removeContainer);

router.get('/:id/logs/download', requireAuth, containerController.downloadContainerLogs);

module.exports = router;
