import { getToken, clearToken, fetchUserProfile, updateUserProfile, updatePassword, getInitials } from '../auth.store.js';
import { showToast } from '../components/toast.js';
import { applyTheme } from '../theme.js';
import { Dropdown } from '../components/UI/Dropdown.js';
import { Tabs } from '../components/UI/Tabs.js';
import { Toggle } from '../components/UI/Toggle.js';

class AccountPage {
    constructor() {
        if (!getToken()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUserRole = 'user';
        this.allUsers = [];

        this.initComponents();
        this.initDOM();
        this.initEvents();
        this.loadProfile();
    }

    initComponents() {
        this.userMenu = new Dropdown('user-menu-btn', 'user-dropdown');
        this.tabs = new Tabs('.tab-btn', '.tab-content');
        
        // UI Toggles (visual)
        this.uiToggles = new Toggle('[role="switch"]:not(#absolute-dark-toggle)');
        
        // Dark Mode Toggle
        const isDark = localStorage.getItem('absolute_dark_mode') === 'true';
        this.darkModeToggle = new Toggle('#absolute-dark-toggle', (toggle, isChecked) => {
            setTimeout(() => {
                localStorage.setItem('absolute_dark_mode', isChecked);
                applyTheme();
            }, 0);
        });

        // init dark mode visual state
        const darkToggleEl = document.getElementById('absolute-dark-toggle');
        if (darkToggleEl && isDark) {
            darkToggleEl.setAttribute('aria-checked', 'true');
            darkToggleEl.classList.remove('bg-slate-700');
            darkToggleEl.classList.add('bg-blue-600');
            const span = darkToggleEl.querySelector('span');
            span.classList.remove('translate-x-0');
            span.classList.add('translate-x-5');
        }
    }

    initDOM() {
        // Profile DOM
        this.profileForm = document.getElementById('profile-form');
        this.usernameInput = document.getElementById('username');
        this.emailInput = document.getElementById('email');
        this.saveProfileBtn = document.getElementById('save-profile-btn');
        this.bigAvatar = document.getElementById('big-avatar-text');
        this.headerAvatar = document.getElementById('header-avatar-container');
        
        // Password DOM
        this.passwordForm = document.getElementById('password-form');
        this.currentPasswordInput = document.getElementById('current-password');
        this.newPasswordInput = document.getElementById('new-password');
        this.confirmPasswordInput = document.getElementById('confirm-password');
        this.changePasswordBtn = document.getElementById('change-password-btn');

        // Admin DOM
        this.usersTableBody = document.getElementById('users-table-body');
        this.userModal = document.getElementById('user-modal');
        this.userModalBackdrop = document.getElementById('user-modal-backdrop');
        this.userModalContent = document.getElementById('user-modal-content');
        this.userModalForm = document.getElementById('user-modal-form');
        this.modalError = document.getElementById('modal-user-error');
        this.modalTitle = document.getElementById('user-modal-title');
        
        this.modalFields = {
            id: document.getElementById('modal-user-id'),
            username: document.getElementById('modal-user-username'),
            email: document.getElementById('modal-user-email'),
            role: document.getElementById('modal-user-role'),
            password: document.getElementById('modal-user-password'),
            passwordHint: document.getElementById('modal-password-hint')
        };
    }

    initEvents() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Forms
        if (this.saveProfileBtn && this.profileForm) {
            this.saveProfileBtn.addEventListener('click', () => this.handleProfileSubmit());
        }
        if (this.changePasswordBtn && this.passwordForm) {
            this.changePasswordBtn.addEventListener('click', () => this.handlePasswordSubmit());
        }

        // Admin Modals
        document.getElementById('add-user-btn')?.addEventListener('click', () => this.openUserModal());
        document.getElementById('close-user-modal-btn')?.addEventListener('click', () => this.closeUserModal());
        document.getElementById('cancel-user-modal-btn')?.addEventListener('click', () => this.closeUserModal());
        
        if (this.userModalForm) {
            this.userModalForm.addEventListener('submit', (e) => this.handleUserModalSubmit(e));
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

    updateAvatars(username) {
        const initials = getInitials(username);
        if (this.bigAvatar) this.bigAvatar.textContent = initials;
        if (this.headerAvatar) {
            this.headerAvatar.innerHTML = `<span class="text-sm font-bold text-slate-300">${initials}</span>`;
        }
    }

    async loadProfile() {
        try {
            const user = await fetchUserProfile();
            this.currentUserRole = user.role || 'user';
            if (this.usernameInput) this.usernameInput.value = user.username || '';
            if (this.emailInput) this.emailInput.value = user.email || '';
            this.updateAvatars(user.username);

            if (this.currentUserRole === 'admin') {
                const adminTab = document.getElementById('admin-users-tab');
                if (adminTab) adminTab.classList.remove('hidden');
                this.loadUsers();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Erreur de chargement du profil', 'error');
        }
    }

    async handleProfileSubmit() {
        const newUsername = this.usernameInput.value.trim();
        const newEmail = this.emailInput.value.trim();

        if (!newUsername || !newEmail) {
            showToast('Tous les champs sont requis', 'error');
            return;
        }

        const originalText = this.saveProfileBtn.textContent;
        this.saveProfileBtn.disabled = true;
        this.saveProfileBtn.textContent = 'Enregistrement...';

        try {
            const res = await updateUserProfile(newUsername, newEmail);
            showToast(res.message || 'Profil mis à jour !', 'success');
            this.updateAvatars(newUsername);
        } catch (error) {
            showToast(error.message || 'Erreur lors de la mise à jour', 'error');
        } finally {
            this.saveProfileBtn.disabled = false;
            this.saveProfileBtn.textContent = originalText;
        }
    }

    async handlePasswordSubmit() {
        const currentPassword = this.currentPasswordInput.value;
        const newPassword = this.newPasswordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Tous les champs sont requis', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Les nouveaux mots de passe ne correspondent pas', 'error');
            return;
        }

        const originalText = this.changePasswordBtn.textContent;
        this.changePasswordBtn.disabled = true;
        this.changePasswordBtn.textContent = 'Mise à jour...';

        try {
            const res = await updatePassword(currentPassword, newPassword);
            showToast(res.message || 'Mot de passe mis à jour !', 'success');
            this.passwordForm.reset();
        } catch (error) {
            showToast(error.message || 'Erreur lors de la mise à jour', 'error');
        } finally {
            this.changePasswordBtn.disabled = false;
            this.changePasswordBtn.textContent = originalText;
        }
    }

    // --- Admin User Methods ---
    async loadUsers() {
        try {
            const API_BASE = localStorage.getItem('dockflow_api_url') || '';
            const res = await fetch(API_BASE + '/api/users', { 
                headers: { 'Authorization': `Bearer ${getToken()}` },
                credentials: 'include' 
            });
            if (!res.ok) throw new Error('Erreur chargement utilisateurs');
            this.allUsers = await res.json();
            this.renderUsersTable();
        } catch (e) {
            console.error(e);
            showToast('Impossible de charger les utilisateurs', 'error');
        }
    }

    renderUsersTable() {
        if (!this.usersTableBody) return;
        this.usersTableBody.innerHTML = '';
        this.allUsers.forEach(user => {
            const roleBadge = user.role === 'admin' 
                ? '<span class="px-2 py-1 text-xs font-medium rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">Admin</span>'
                : '<span class="px-2 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">User</span>';
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-800/50 cursor-pointer transition-colors group';
            tr.innerHTML = `
                <td class="px-4 py-3 font-medium text-white flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        ${getInitials(user.username)}
                    </div>
                    ${user.username}
                </td>
                <td class="px-4 py-3 text-slate-400">${user.email}</td>
                <td class="px-4 py-3">${roleBadge}</td>
                <td class="px-4 py-3 text-right">
                    <button class="delete-user-btn text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" data-id="${user.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            `;
            
            tr.addEventListener('click', (e) => {
                if(e.target.closest('.delete-user-btn')) return;
                this.openUserModal(user);
            });
            
            this.usersTableBody.appendChild(tr);
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                    await this.deleteUser(id);
                }
            });
        });
    }

    openUserModal(user = null) {
        this.modalError.classList.add('hidden');
        if (user) {
            this.modalTitle.textContent = "Modifier l'utilisateur";
            this.modalFields.id.value = user.id;
            this.modalFields.username.value = user.username;
            this.modalFields.email.value = user.email;
            this.modalFields.role.value = user.role;
            this.modalFields.password.value = '';
            this.modalFields.password.required = false;
            this.modalFields.passwordHint.classList.remove('hidden');
        } else {
            this.modalTitle.textContent = "Ajouter un utilisateur";
            this.userModalForm.reset();
            this.modalFields.id.value = '';
            this.modalFields.password.required = true;
            this.modalFields.passwordHint.classList.add('hidden');
        }

        this.userModal.classList.remove('hidden');
        this.userModal.classList.add('flex');
        
        // trigger reflow
        void this.userModal.offsetWidth;
        
        this.userModalBackdrop.classList.remove('opacity-0');
        this.userModalContent.classList.remove('opacity-0', 'scale-95');
    }

    closeUserModal() {
        this.userModalBackdrop.classList.add('opacity-0');
        this.userModalContent.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            this.userModal.classList.add('hidden');
            this.userModal.classList.remove('flex');
        }, 300);
    }

    async handleUserModalSubmit(e) {
        e.preventDefault();
        this.modalError.classList.add('hidden');
        
        const id = this.modalFields.id.value;
        const data = {
            username: this.modalFields.username.value,
            email: this.modalFields.email.value,
            role: this.modalFields.role.value,
            password: this.modalFields.password.value
        };

        try {
            const API_BASE = localStorage.getItem('dockflow_api_url') || '';
            const url = id ? `${API_BASE}/api/users/${id}` : `${API_BASE}/api/users`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            const result = await res.json();
            
            if (!res.ok) {
                throw new Error(result.message || 'Erreur API');
            }

            showToast(id ? 'Utilisateur modifié' : 'Utilisateur créé', 'success');
            this.closeUserModal();
            this.loadUsers();

        } catch (err) {
            this.modalError.textContent = err.message;
            this.modalError.classList.remove('hidden');
        }
    }

    async deleteUser(id) {
        try {
            const API_BASE = localStorage.getItem('dockflow_api_url') || '';
            const res = await fetch(`${API_BASE}/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                credentials: 'include'
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Erreur API');
            
            showToast('Utilisateur supprimé', 'success');
            this.loadUsers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }
}

// Initialize Application Page
document.addEventListener('DOMContentLoaded', () => {
    new AccountPage();
});
