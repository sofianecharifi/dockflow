require("dotenv").config({ override: true });
const http = require("http");
const { Server } = require("socket.io");
const containersRoutes = require("./src/modules/containers/containers.routes");
const authRoutes = require("./src/modules/auth/auth.routes");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const { initWebSockets } = require("./src/modules/websockets/socket");

const app = express();
app.use(cors({ origin: true, credentials: true }));
const port = process.env.PORT || 3000;

// init http & ws
const server = http.createServer(app);
const io = new Server(server);

// initialize websockets
initWebSockets(io);

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