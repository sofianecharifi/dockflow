const { createOSUtils } = require('node-os-utils');
const osUtils = createOSUtils({
    cpu: {
        samplingInterval: 500, // cpu interval (ms)
        cacheTTL: 500          // cache ttl (ms)
    }
});

async function getSystemStats() {
    try {
        const cpuResult = await osUtils.cpu.usage();
        const memResult = await osUtils.memory.info();

        let diskPercentage = 0;
        try {
            const fs = require('fs');
            const path = require('path');
            // On vérifie si on a monté le disque de l'hôte dans /hostfs, sinon on prend la racine du conteneur
            const checkPath = fs.existsSync('/hostfs') ? '/hostfs' : path.parse(process.cwd()).root;
            const stats = await fs.promises.statfs(checkPath);
            const used = stats.blocks - stats.bfree;
            const totalForNonRoot = used + stats.bavail;
            diskPercentage = (used / totalForNonRoot) * 100;
            if (isNaN(diskPercentage)) diskPercentage = 0;
        } catch (e) {
            console.error("Erreur stats disque:", e);
        }

        let cpuPercentage = 0;
        let ramPercentage = 0;
        if (cpuResult.success) {
            cpuPercentage = cpuResult.data;
        }

        if (memResult.success && memResult.data) {
            ramPercentage = memResult.data.usagePercentage || 0;
        }



        // format for frontend
        return {
            cpu: Math.round(cpuPercentage),
            ram: Math.round(ramPercentage),
            disk: Math.round(diskPercentage)
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques système :", error);
        // fallback values
        return { cpu: 0, ram: 0, disk: 0 };
    }
}

module.exports = {
    getSystemStats
};
