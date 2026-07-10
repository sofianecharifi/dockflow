require("dotenv").config({ override: true });
const http = require("http");
const { Server } = require("socket.io");
const containersRoutes = require("./src/modules/containers/containers.routes");
const authRoutes = require("./src/modules/auth/auth.routes");
const usersRoutes = require("./src/modules/users/users.routes");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const { initWebSockets } = require("./src/modules/websockets/socket");

const app = express();
const corsOptions = {
    origin: (origin, callback) => {
        callback(null, origin || true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
const port = process.env.PORT || 3000;


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["*"],
        credentials: false
    }
});


initWebSockets(io);


app.use(morgan("dev"));


app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.use(express.static(path.join(__dirname, "../frontend"), { index: false }));


app.use('/api/containers', containersRoutes);
app.use('/api/users', usersRoutes);



const db = require('./src/config/database');
db.initDb().then(() => {
    server.listen(port, '0.0.0.0', () => {
        console.log(`DockFlow listening on port http://localhost:${port}`);
    });
});