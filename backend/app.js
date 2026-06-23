require("dotenv").config({ override: true });
const http = require("http");
const { Server } = require("socket.io");
const { getSystemStats } = require("./src/modules/system/system.service");
const { getContainersStats } = require("./src/modules/containers/containers.service");
const containersRoutes = require("./src/modules/containers/containers.routes");
const authRoutes = require("./src/modules/auth/auth.routes");
const docker = require("./src/config/docker");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true, credentials: true }));
const port = process.env.PORT || 3000;

// init http & ws
const server = http.createServer(app);
const io = new Server(server);

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
    // 1 sec refresh
    setTimeout(broadcastStats, 1000);
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

    // setup logs

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

// logger
app.use(morgan("dev"));

// body parser
app.use(express.json());
app.use(cookieParser());

// auth
app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.use(express.static(path.join(__dirname, "../frontend"), { index: false }));

// protected containers routes
app.use('/api/containers', containersRoutes);


// boot
const db = require('./src/config/database');
db.initDb().then(() => {
    server.listen(port, '0.0.0.0', () => {
        console.log(`DockFlow listening on port http://localhost:${port}`);
    });
});