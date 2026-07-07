const { createOSUtils } = require('node-os-utils');

// Initialize OS utilities with a 500ms sampling interval and cache TTL 
// to ensure fresh metrics without overloading the host CPU.
const osUtils = createOSUtils({
    cpu: {
        samplingInterval: 200,
        cacheTTL: 200
    }
});

const docker = require('../../config/docker');

/**
 * Retrieves the current system metrics including CPU and Memory.
 * In case a specific metric fails to load, it falls back to null so the client UI 
 * can properly represent the unavailable state instead of falsely reporting 0%.
 * 
 * @returns {Promise<{cpu: number|null, ram: number|null, totalRam: number|null}>}
 */
async function getSystemStats() {
    let cpuPercentage = null;
    let ramPercentage = null;
    let totalRam = null;
    let cpuModel = "Inconnu";

    try {
        const os = require('os');
        const cpus = os.cpus();
        if (cpus && cpus.length > 0) {
            cpuModel = cpus[0].model;
        }

        const cpuResult = await osUtils.cpu.usage();
        if (cpuResult && cpuResult.success) {
            cpuPercentage = Math.round(cpuResult.data);
        }

        const memResult = await osUtils.memory.info();
        if (memResult && memResult.success && memResult.data) {
            ramPercentage = Math.round(memResult.data.usagePercentage || 0);
        }

        try {
            const dockerInfo = await docker.info();
            totalRam = dockerInfo.MemTotal;
        } catch (e) {
            console.error("Failed to retrieve docker info for total RAM:", e);
        }

        return {
            cpu: cpuPercentage,
            cpuModel: cpuModel,
            ram: ramPercentage,
            totalRam: totalRam
        };
    } catch (error) {
        console.error("Failed to retrieve system statistics:", error);
        return { cpu: null, cpuModel: "Erreur", ram: null, totalRam: null };
    }
}

module.exports = {
    getSystemStats
};
