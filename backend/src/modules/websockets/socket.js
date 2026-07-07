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
                console.error("Stats error:", err);
            }
        }
        // 2000ms refresh for better server performance
        setTimeout(broadcastStats, 500);
    };

    // start loop
    broadcastStats();

    // ws auth middleware — triple fallback for cross-origin Tauri compatibility
    // 1. Cookie (standard browser, same-origin)
    // 2. socket.handshake.auth.token (socket.io v3+ auth handshake — used by Tauri)
    // 3. socket.handshake.query.token (legacy fallback)
    io.use((socket, next) => {
        console.log('[WS] New connection attempt from:', socket.handshake.headers.origin);
        
        // Redact token for logging security
        const authData = { ...socket.handshake.auth };
        if (authData.token) authData.token = '[REDACTED]';
        console.log('[WS] Auth payload:', authData);

        const queryData = { ...socket.handshake.query };
        if (queryData.token) queryData.token = '[REDACTED]';
        console.log('[WS] Query string:', queryData);

        try {
            // 1. Try cookie (standard browser access)
            const cookies = cookie.parse(socket.request.headers.cookie || '');
            let token = cookies.dockflow_token;
            console.log('[WS] Token from cookie:', token ? 'Present' : 'Absent');

            // 2. Fallback: token passed via socket.io auth handshake (Tauri/Electron/Capacitor)
            if (!token && socket.handshake.auth && socket.handshake.auth.token) {
                token = socket.handshake.auth.token;
                console.log('[WS] Token from auth handshake:', token ? 'Present' : 'Absent');
            }

            // 3. Last resort: token in query string
            if (!token && socket.handshake.query && socket.handshake.query.token) {
                token = socket.handshake.query.token;
                console.log('[WS] Token from query:', token ? 'Present' : 'Absent');
            }

            if (!token) {
                console.error('[WS] Rejected: No token provided');
                return next(new Error('Authentication error'));
            }

            jwt.verify(token, process.env.JWT_SECRET);
            console.log('[WS] Token verified successfully');
            next();
        } catch (err) {
            console.error('[WS] Rejected: Invalid token', err.message);
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
                console.error("Error retrieving logs:", err);
                socket.emit('container-logs', `Error: ${err.message}`);
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
