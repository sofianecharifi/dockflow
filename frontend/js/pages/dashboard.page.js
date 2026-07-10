import '../theme.js';
import { getToken, clearToken, fetchUserProfile, getInitials } from '../auth.store.js';
import { Dropdown } from '../components/UI/Dropdown.js';
import { ContainerGrid } from '../components/Dashboard/ContainerGrid.js';
import { ContainerActions } from '../components/Dashboard/ContainerActions.js';
import { DashboardSocket } from '../components/Dashboard/DashboardSocket.js';

class DashboardPage {
    constructor() {
        if (!getToken()) {
            window.location.href = 'login.html';
            return;
        }

        this.initDOM();
        this.initComponents();
        this.initEvents();
        this.start();
    }

    initDOM() {
        this.headerAvatar = document.getElementById('header-avatar-container');
        this.logoutBtn = document.getElementById('logout-btn');
    }

    initComponents() {
        // Dropdown menu
        this.userMenu = new Dropdown('user-menu-btn', 'user-dropdown');

        // Dashboard sub-systems
        this.grid = new ContainerGrid();
        this.socketManager = new DashboardSocket(this.grid);
        
        // Pass a getter for the raw socket to the actions (needed for logs modal)
        this.actions = new ContainerActions(this.grid, () => this.socketManager.socket);
    }

    initEvents() {
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogout() {
        try {
            const API_BASE = localStorage.getItem('dockflow_api_url') || '';
            await fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            clearToken();
            window.location.href = 'login.html';
        }
    }

    async start() {
        try {
            // Setup WebSocket
            this.socketManager.connect();
            
            // Fetch initial data
            await this.grid.fetchAndRender();
            
            // Setup User Profile and Permissions
            await this.setupProfile();

        } catch (error) {
            console.error("Erreur lors de l'initialisation du tableau de bord :", error);
            if (error.message === 'Session expirée' || (error.message && error.message.includes('Impossible de'))) {
                window.location.href = 'login.html';
            }
        }
    }

    async setupProfile() {
        try {
            const user = await fetchUserProfile();
            const initials = getInitials(user.username);
            if (this.headerAvatar) {
                this.headerAvatar.innerHTML = `<span class="text-sm font-bold text-slate-300">${initials}</span>`;
            }

            // Enforce Read-Only mode for standard users
            if (user.role === 'user') {
                const style = document.createElement('style');
                style.textContent = `
                    button[data-action="start"],
                    button[data-action="stop"],
                    button[data-action="restart"],
                    button[data-action="pull"],
                    button[data-action="remove"] {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (e) {
            console.error('Failed to load profile for header', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DashboardPage();
});
