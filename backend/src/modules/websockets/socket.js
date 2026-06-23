const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const docker = require("../../config/docker");
const { getSystemStats } = require("../system/system.service");
const { getContainersStats } = require("../containers/containers.service");

function initWebSockets(io) {
    // broadcast stats loop
    const broadcastStats = async () => {
        // limit to active clients
        if (io.engine.clientsCount > 0) {
            try {
                const stats = await getSystemStats();
                io.emit('system-stats', stats);

                const containersData = await getContainersStats();
                io.emit('containers-stats', containersData);
            } catch (err) {
                console.error("Erreur stats:", err);
            }
        }
        // 2000ms refresh for better server performance
        setTimeout(broadcastStats, 500);
    };

    // start loop
    broadcastStats();

    // ws auth middleware
    io.use((socket, next) => {
        try {
            const cookies = cookie.parse(socket.request.headers.cookie || '');
            const token = cookies.dockflow_token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // ws handlers
    io.on('connection', (socket) => {
        let logStream = null;
        let stdoutPass = null;
        let stderrPass = null;

        const cleanupLogs = () => {
            if (logStream) {
                logStream.destroy();
                logStream = null;
            }
            if (stdoutPass) {
                stdoutPass.destroy();
                stdoutPass = null;
            }
            if (stderrPass) {
                stderrPass.destroy();
                stderrPass = null;
            }
        };

        socket.on('request-logs', async (id) => {
            cleanupLogs();

            try {
                const cleanId = id.trim();
                const container = docker.getContainer(cleanId);
                logStream = await container.logs({ stdout: true, stderr: true, follow: true, tail: 100 });

                // bypass headers and split streams
                const { PassThrough } = require('stream');
                stdoutPass = new PassThrough();
                stderrPass = new PassThrough();

                stdoutPass.on('data', (chunk) => {
                    socket.emit('container-logs', { type: 'stdout', text: chunk.toString('utf8') });
                });

                stderrPass.on('data', (chunk) => {
                    socket.emit('container-logs', { type: 'stderr', text: chunk.toString('utf8') });
                });

                // demux docker stream
                container.modem.demuxStream(logStream, stdoutPass, stderrPass);

            } catch (err) {
                console.error("Erreur de récupération des logs:", err);
                socket.emit('container-logs', `Erreur: ${err.message}`);
            }
        });

        socket.on('stop-logs', () => {
            cleanupLogs();
        });

        socket.on('disconnect', () => {
            cleanupLogs();
        });
    });
}

module.exports = { initWebSockets };
