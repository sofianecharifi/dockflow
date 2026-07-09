import { getToken, clearToken, fetchUserProfile, updateUserProfile, updatePassword, getInitials } from '../auth.store.js';
import { showToast } from '../components/toast.js';
import { applyTheme } from '../theme.js';

if (!getToken()) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Header Menu Logic ---
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !userDropdown.classList.contains('opacity-0');
            if (isOpen) {
                userDropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            } else {
                userDropdown.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
            }
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userDropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            }
        });
    }

    // --- Logout Logic ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const API_BASE = localStorage.getItem('dockflow_api_url') || '';
                await fetch(API_BASE + '/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (e) {
                console.error('Logout error', e);
            } finally {
                clearToken();
                window.location.href = 'login.html';
            }
        });
    }

    // --- Tabs Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state from all buttons
            tabBtns.forEach(b => {
                const isDanger = b.dataset.target === 'tab-danger';
                if (isDanger) {
                    b.classList.remove('active', 'bg-red-500/10', 'text-red-500', 'border-red-500/20', 'shadow-sm', 'shadow-red-500/10');
                    b.classList.add('text-red-400', 'hover:text-red-300', 'hover:bg-red-500/10', 'border-transparent');
                } else {
                    b.classList.remove('active', 'bg-blue-500/10', 'text-blue-400', 'border-blue-500/20', 'shadow-sm', 'shadow-blue-500/10');
                    b.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/50', 'border-transparent');
                }
            });

            // Add active state to clicked button
            const isBtnDanger = btn.dataset.target === 'tab-danger';
            if (isBtnDanger) {
                btn.classList.add('active', 'bg-red-500/10', 'text-red-500', 'border-red-500/20', 'shadow-sm', 'shadow-red-500/10');
                btn.classList.remove('text-red-400', 'hover:text-red-300', 'hover:bg-red-500/10', 'border-transparent');
            } else {
                btn.classList.add('active', 'bg-blue-500/10', 'text-blue-400', 'border-blue-500/20', 'shadow-sm', 'shadow-blue-500/10');
                btn.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/50', 'border-transparent');
            }

            // Hide all contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Show target content
            const targetId = btn.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });

    // --- Toggles UI Logic (visual only for now) ---
    const toggleBtns = document.querySelectorAll('[role="switch"]');
    toggleBtns.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const isChecked = toggle.getAttribute('aria-checked') === 'true';
            const span = toggle.querySelector('span');
            
            if (isChecked) {
                toggle.setAttribute('aria-checked', 'false');
                toggle.classList.remove('bg-blue-600');
                toggle.classList.add('bg-slate-700');
                span.classList.remove('translate-x-5');
                span.classList.add('translate-x-0');
            } else {
                toggle.setAttribute('aria-checked', 'true');
                toggle.classList.remove('bg-slate-700');
                toggle.classList.add('bg-blue-600');
                span.classList.remove('translate-x-0');
                span.classList.add('translate-x-5');
            }
        });
    });

    // --- Absolute Dark Mode Logic ---
    const absoluteDarkToggle = document.getElementById('absolute-dark-toggle');
    if (absoluteDarkToggle) {
        // Init visual state
        const isDark = localStorage.getItem('absolute_dark_mode') === 'true';
        if (isDark) {
            absoluteDarkToggle.setAttribute('aria-checked', 'true');
            absoluteDarkToggle.classList.remove('bg-slate-700');
            absoluteDarkToggle.classList.add('bg-blue-600');
            const span = absoluteDarkToggle.querySelector('span');
            span.classList.remove('translate-x-0');
            span.classList.add('translate-x-5');
        }

        absoluteDarkToggle.addEventListener('click', () => {
            // Visual toggle is already handled by generic logic above
            // We just need to persist it and apply theme
            setTimeout(() => {
                const isChecked = absoluteDarkToggle.getAttribute('aria-checked') === 'true';
                localStorage.setItem('absolute_dark_mode', isChecked);
                applyTheme();
            }, 0);
        });
    }

    // --- Profile Data Management ---
    
    // UI Elements
    const profileForm = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const bigAvatar = document.getElementById('big-avatar-text');
    const headerAvatar = document.getElementById('header-avatar-container');
    
    // Helper to set avatars
    function updateAvatars(username) {
        const initials = getInitials(username);
        if (bigAvatar) bigAvatar.textContent = initials;
        
        if (headerAvatar) {
            headerAvatar.innerHTML = `<span class="text-sm font-bold text-slate-300">${initials}</span>`;
        }
    }

    // Load data
    async function initProfile() {
        try {
            const user = await fetchUserProfile();
            if (usernameInput) usernameInput.value = user.username || '';
            if (emailInput) emailInput.value = user.email || '';
            updateAvatars(user.username);
        } catch (error) {
            console.error('Error loading profile:', error);
            showToast('Erreur de chargement du profil', 'error');
        }
    }

    // Save data
    if (saveProfileBtn && profileForm) {
        saveProfileBtn.addEventListener('click', async () => {
            const newUsername = usernameInput.value.trim();
            const newEmail = emailInput.value.trim();

            if (!newUsername || !newEmail) {
                showToast('Tous les champs sont requis', 'error');
                return;
            }

            const originalText = saveProfileBtn.textContent;
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Enregistrement...';

            try {
                const res = await updateUserProfile(newUsername, newEmail);
                showToast(res.message || 'Profil mis à jour !', 'success');
                updateAvatars(newUsername);
            } catch (error) {
                showToast(error.message || 'Erreur lors de la mise à jour', 'error');
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = originalText;
            }
        });
    }

    // --- Password Change Logic ---
    const passwordForm = document.getElementById('password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const changePasswordBtn = document.getElementById('change-password-btn');

    if (changePasswordBtn && passwordForm) {
        changePasswordBtn.addEventListener('click', async () => {
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                showToast('Tous les champs sont requis', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('Les nouveaux mots de passe ne correspondent pas', 'error');
                return;
            }

            const originalText = changePasswordBtn.textContent;
            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = 'Mise à jour...';

            try {
                const res = await updatePassword(currentPassword, newPassword);
                showToast(res.message || 'Mot de passe mis à jour !', 'success');
                passwordForm.reset();
            } catch (error) {
                showToast(error.message || 'Erreur lors de la mise à jour', 'error');
            } finally {
                changePasswordBtn.disabled = false;
                changePasswordBtn.textContent = originalText;
            }
        });
    }

    // Initialize
    initProfile();

});
