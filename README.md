# DockFlow

DockFlow is a lightweight, efficient container management application designed to simplify the administration of Docker environments. It provides a comprehensive dashboard for monitoring server resources, managing container lifecycles, and viewing real-time logs, offering a streamlined alternative to heavier management solutions.

## Architecture Overview

The application is structured into two main components, ensuring clear separation of concerns and maintainability.

### Backend
The backend service is built with Node.js and Express, designed to securely interact with the host Docker daemon.
- **Runtime & Framework:** Node.js, Express
- **Docker Integration:** `dockerode` for programmatic interactions with the Docker API.
- **Real-Time Communication:** `socket.io` for streaming live container logs and server statistics (CPU, RAM, Disk usage) to the client, **secured with JWT authentication**.
- **Data Persistence:** SQLite (`better-sqlite3`) for robust, file-based data storage, properly mounted as a Docker volume.
- **Authentication:** JWT (JSON Web Tokens) and bcrypt for secure user authentication, session management, and WebSocket connection validation.

### Frontend
The user interface is designed to be responsive, fast, and easily deployable across multiple platforms, including desktop and mobile environments.
- **Core Technologies:** Vanilla HTML, CSS, and JavaScript.
- **Styling:** TailwindCSS for a modern, responsive design system.
- **Cross-Platform Deployment:** Configured with both **Capacitor** (for seamless compilation into native mobile applications like iOS and Android) and **Electron** (for native desktop applications).

## Key Features

- **Resource Monitoring:** Real-time transmission of system statistics (CPU, memory, and disk usage).
- **Container Management:** Start, stop, restart, and remove Docker containers directly from the user interface.
- **Secure Log Streaming:** View live container logs through a built-in terminal interface powered by authenticated WebSockets.
- **Secure Administrator Setup:** Dedicated initialization sequence to safely set up the root administrator upon the first launch.
- **Multi-Platform:** Usable via a standard web browser, as a desktop application (Electron), or as a mobile application (Capacitor).

## Prerequisites

Ensure the following dependencies are installed on the host machine before proceeding:
- **Node.js** (v18 or higher recommended)
- **npm** (Node Package Manager)
- **Docker Engine** (running and accessible)

## Installation and Setup

1. **Clone the Repository**
   Retrieve the project source code to your local machine.

2. **Backend Configuration**
   Navigate to the `backend` directory and install the necessary dependencies:
   ```bash
   cd backend
   npm install
   ```
   Start the backend server:
   ```bash
   npm start
   ```
   *(Use `npm run dev` for development with hot-reloading via nodemon).*

3. **Frontend Configuration**
   Navigate to the `frontend` directory to install dependencies for Tailwind, Capacitor, or Electron:
   ```bash
   cd frontend
   npm install
   ```

4. **Docker Compose Deployment**
   Alternatively, deploy the entire stack using the provided Docker Compose configuration. This approach maps the Docker socket (`/var/run/docker.sock`) and persists the database:
   ```bash
   docker-compose up -d
   ```

## Development and Testing Considerations

- **Platform-Specific Emulation:** When deploying as a mobile (Capacitor) or desktop (Electron) application, ensure you test network requests within their respective sandboxes, as CORS and IP configurations may differ from standard web browsers.
- **Database Persistence:** The `docker-compose.yml` mounts `./backend/db` to the container to ensure the SQLite database (and your admin account) is not lost when the container stops. Make sure directory permissions are correctly set on the host.