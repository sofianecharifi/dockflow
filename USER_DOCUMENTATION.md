# DockFlow - User Documentation

Welcome to DockFlow! DockFlow is a lightweight, efficient container management application designed to simplify the administration of your Docker environments. It provides an intuitive dashboard for monitoring server resources, managing container lifecycles, and viewing real-time logs.

This guide will help you understand how to use DockFlow's features effectively.

---

## 1. Getting Started

### First Launch & Setup
When you launch DockFlow for the first time, you will be prompted to complete a **Secure Administrator Setup**. 
This initialization sequence is required to create the root administrator account. Since DockFlow manages your Docker daemon, this setup ensures that only authorized users can access the system.
- Follow the on-screen instructions to create your admin account (email and password).
- *Note: This setup is only available on the very first launch. Once the root admin is created, this screen will no longer appear.*

### Logging In
Once the setup is complete, you can log in using your administrator credentials. DockFlow uses secure session management to keep your connection safe.

---

## 2. Dashboard & Resource Monitoring

Upon logging in, you will be greeted by the main dashboard. The dashboard provides a real-time overview of your host server's health:
- **System Statistics:** View live metrics for your host machine's **CPU**, **Memory (RAM)**, and **Disk usage**.
- The metrics update automatically without needing to refresh the page, giving you a continuous view of your server's performance.

---

## 3. Container Management

DockFlow allows you to manage your Docker containers directly from the user interface.

### Viewing Containers
You can see a complete list of all Docker containers currently on your host. For running containers, DockFlow also streams real-time CPU and RAM usage specific to each container.

### Actions
For each container, you can perform the following actions using the provided interface buttons:
- **Start:** Boot up a stopped container.
- **Stop:** Safely halt a running container.
- **Restart:** Reboot a container quickly.
- **Pull:** Pull the latest image for the container and recreate it seamlessly.
- **Remove (Delete):** Permanently delete a container from your host.

---

## 4. Live Logs & Terminal

Debugging and monitoring are made easy with DockFlow's real-time logging features.

- **Secure Log Streaming:** By selecting a container, you can open a built-in terminal interface to view its live logs.
- **Real-Time Output:** The terminal streams both Standard Output (stdout) and Standard Error (stderr) directly from the container in real-time.
- **Download Logs:** If you need to analyze logs externally or keep a record, you can trigger a direct download of a container's log file using the download option.

---

## 5. Multi-Platform Access

DockFlow is designed to be flexible and accessible from wherever you are. You can interact with DockFlow through:
- **Web Browser:** Access the dashboard via a standard web browser on your network.
- **Desktop Application:** Run DockFlow as a native desktop application (powered by Electron) for a dedicated management experience.
- **Mobile Application:** Use the DockFlow mobile app (iOS/Android) to monitor and manage your containers on the go.

Enjoy a streamlined and responsive experience across all platforms!
