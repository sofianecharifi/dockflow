# DockFlow - Technical Documentation

DockFlow is a lightweight, efficient container management application designed to simplify the administration of Docker environments. This document provides an exhaustive overview of the technical stack, architecture, database schemas, APIs, and real-time communication flows.

---

## 1. Architecture Overview

DockFlow strictly adheres to a client-server architecture with real-time capabilities.

### Backend (Node.js & Express)
The backend functions as a RESTful API provider and a secure WebSocket streaming server. It acts as the intermediary between the frontend clients and the host's Docker Daemon.

- **Environment:** Node.js (v18+)
- **Core Framework:** Express (`express`)
- **Docker API Engine:** `dockerode` (provides direct socket-level communication with `/var/run/docker.sock`)
- **Real-Time Streaming:** `socket.io` & `ws`
- **Data Persistence:** SQLite embedded engine (`better-sqlite3`)
- **Security & Session:**
  - Token-based Authentication: `jsonwebtoken` (JWT)
  - Cryptography: `bcrypt` for password hashing, `crypto` for automatic secret generation.
  - Middlewares: `cookie-parser` (for HttpOnly JWT cookies), `cors`, `morgan` (logging).

### Frontend (Multi-platform)
Designed to be lightweight with no heavy JS frameworks (React/Vue/Angular), ensuring maximum performance and cross-device compatibility.

- **Languages:** Vanilla HTML, CSS, JavaScript.
- **Styling:** TailwindCSS v4.
- **Build & Packaging:**
  - **Desktop Native:** Electron with `electron-builder`.
  - **Mobile Native:** Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/android`).

---

## 2. Database Schema (SQLite)

The database is powered by `better-sqlite3` and is automatically initialized on the first boot. Custom asynchronous wrappers (`runAsync`, `getAsync`, `allAsync`) are implemented for seamless Promise-based queries.

**Table: `users`**
Handles administrator accounts.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `email` (TEXT UNIQUE NOT NULL)
- `password` (TEXT NOT NULL) - Hashed using bcrypt.
- `role` (TEXT DEFAULT 'user')
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

**Table: `server_config`**
Stores critical server parameters, such as the encryption secret.
- `key` (TEXT PRIMARY KEY)
- `value` (TEXT NOT NULL)
*Note: The `jwt_secret` is automatically generated (64 random bytes) and stored here upon the first launch if it does not exist.*

---

## 3. RESTful API Endpoints

All API responses are formatted in JSON. Endpoints managing containers require authentication via an HttpOnly cookie named `dockflow_token`.

### Authentication (`/api/auth`)
- `GET /api/auth/setup/status` : Checks if the root admin account has been created.
- `POST /api/auth/setup` : Initializes the root admin account (only available if status is false).
- `POST /api/auth/login` : Authenticates the user and sets the `dockflow_token` HttpOnly cookie.
- `POST /api/auth/logout` : Clears the authentication session/cookie.

### Containers Management (`/api/containers`)
*Protected by `requireAuth` middleware.*
- `GET /api/containers/` : Retrieves a full list of all Docker containers on the host (bypasses browser cache).
- `POST /api/containers/:id/start` : Starts a specific container.
- `POST /api/containers/:id/stop` : Stops a running container.
- `POST /api/containers/:id/restart` : Restarts a container.
- `POST /api/containers/:id/pull` : Pulls the latest image and recreates the container.
- `DELETE /api/containers/:id` : Removes a container.
- `GET /api/containers/:id/logs/download` : Triggers a direct download of the container's log file.

---

## 4. Real-Time WebSockets Architecture

The WebSocket server (`socket.io`) is heavily utilized for live monitoring. It enforces the same JWT authentication as the REST API.

### Global Broadcasting Loop
The server runs a recursive loop every 500ms to broadcast system and container metrics, **only if there are active connected clients**.
- **Event `system-stats`:** Broadcasts Host CPU, RAM, and Disk usage (gathered via `node-os-utils`).
- **Event `containers-stats`:** Broadcasts real-time metrics (CPU/RAM usage) of running containers.

### Live Container Logs Demultiplexing
When a client requests live logs for a specific container, the server streams the output directly from Docker.

- **Listener `request-logs` (container ID):**
  - Fetches the container instance via `dockerode`.
  - Attaches a stream (`stdout: true, stderr: true, follow: true, tail: 100`).
  - **Demultiplexing:** Uses Docker's `modem.demuxStream` to cleanly separate Standard Output and Standard Error into Node.js `PassThrough` streams.
  - **Emitters:** 
    - `socket.emit('container-logs', { type: 'stdout', text: chunk })`
    - `socket.emit('container-logs', { type: 'stderr', text: chunk })`
- **Listener `stop-logs`:** Safely destroys active streams to prevent memory leaks.

---

## 5. Deployment & Configuration

### Docker Compose (`docker-compose.yml`)
The official deployment method for production environments.

```yaml
version: '3.8'
services:
  dockflow:
    build: .
    container_name: dockflow_app
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock # Crucial for dockerode to function
      - ./backend/db:/app/backend/db # Mounts the SQLite DB ensuring admin credentials persist
    restart: unless-stopped
```

### Security Considerations
- **Socket Permissions:** Mounting `/var/run/docker.sock` grants the container root-level control over the Docker daemon. DockFlow restricts access to this capability via strict JWT verification.
- **Cross-Origin Resource Sharing (CORS):** Explicitly allows credentials (`origin: true, credentials: true`) to support cookie-based authentication across various native clients (Electron/Capacitor).

---

## 6. Development Workflow

1. **Backend Initialization:**
   ```bash
   cd backend
   npm install
   npm run dev # Boots nodemon on port 3000
   ```
2. **Frontend Compilation:**
   ```bash
   cd frontend
   npm install
   npm run build # Processes Tailwind CSS via build.js
   ```
3. **Native Packaging (Optional):**
   - Use `npx cap sync` for Capacitor (iOS/Android).
   - Use `electron-builder` for Desktop executables.
