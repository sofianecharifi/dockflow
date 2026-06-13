const express = require('express');
const router = express.Router();
const { listContainers, startContainer, stopContainer, restartContainer, removeContainer, pullAndRecreateContainer, downloadContainerLogs } = require('./containers.controller');
const requireAuth = require('../../middlewares/requireAuth');

// list all containers
router.get('/', requireAuth, async (req, res) => {
    try {
        const containers = await listContainers();
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(containers);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// container actions
router.post('/:id/start', requireAuth, startContainer);
router.post('/:id/stop', requireAuth, stopContainer);
router.post('/:id/restart', requireAuth, restartContainer);
router.post('/:id/pull', requireAuth, pullAndRecreateContainer);
router.delete('/:id', requireAuth, removeContainer);

router.get('/:id/logs/download', requireAuth, downloadContainerLogs);

module.exports = router;
