const { createOSUtils } = require('node-os-utils');

// Initialize OS utilities with a 500ms sampling interval and cache TTL 
// to ensure fresh metrics without overloading the host CPU.
const osUtils = createOSUtils({
    cpu: {
        samplingInterval: 500,
        cacheTTL: 500
    }
});

/**
 * Retrieves the current system metrics including CPU, Memory, and Disk usage.
 * In case a specific metric fails to load, it falls back to null so the client UI 
 * can properly represent the unavailable state instead of falsely reporting 0%.
 * 
 * @returns {Promise<{cpu: number|null, ram: number|null, disk: number|null}>}
 */
async function getSystemStats() {
    let cpuPercentage = null;
    let ramPercentage = null;
    let diskPercentage = null;

    try {
        const cpuResult = await osUtils.cpu.usage();
        if (cpuResult && cpuResult.success) {
            cpuPercentage = Math.round(cpuResult.data);
        }

        const memResult = await osUtils.memory.info();
        if (memResult && memResult.success && memResult.data) {
            ramPercentage = Math.round(memResult.data.usagePercentage || 0);
        }

        try {
            // Retrieve root OS drive statistics using cross-platform node-os-utils
            const driveInfo = await osUtils.disk.overallUsage();
            if (driveInfo && driveInfo.success) {
                diskPercentage = Math.round(parseFloat(driveInfo.data));
            }
            if (isNaN(diskPercentage)) {
                diskPercentage = null;
            }
        } catch (e) {
            console.error("Failed to retrieve disk statistics:", e);
        }

        return {
            cpu: cpuPercentage,
            ram: ramPercentage,
            disk: diskPercentage
        };
    } catch (error) {
        console.error("Failed to retrieve system statistics:", error);
        return { cpu: null, ram: null, disk: null };
    }
}

module.exports = {
    getSystemStats
};
