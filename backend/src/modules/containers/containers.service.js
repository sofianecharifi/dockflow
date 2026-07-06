const docker = require("../../config/docker");

async function getContainersStats() {
    try {
        const rawContainers = await docker.listContainers({ all: true, size: true });
        const containersPromises = rawContainers.map(async (container) => {
            const cData = {
                id: container.Id,
                name: container.Names[0]?.replace("/", ""),
                image: container.Image,
                state: container.State,
                status: container.Status,
                sizeRw: container.SizeRw || 0,
                sizeRootFs: container.SizeRootFs || 0,
                ramUsage: 0,
                ramLimit: 0
            };

            if (container.State === 'running') {
                try {
                    const cStats = await docker.getContainer(container.Id).stats({stream: false});
                    cData.ramUsage = cStats.memory_stats?.usage || 0;
                    cData.ramLimit = cStats.memory_stats?.limit || 0;
                } catch (e) {
                    // ignore if container dies during stats fetch
                }
            }
            return cData;
        });
        
        return await Promise.all(containersPromises);
    } catch (err) {
        console.error("Error retrieving container stats:", err);
        return [];
    }
}

module.exports = {
    getContainersStats
};
