import '../theme.js';
import { setupAdminRequest, checkSetupStatusRequest } from '../api/auth.api.js';

class SetupPage {
    constructor() {
        this.verifySetup();
        this.initDOM();
        this.initEvents();
    }

    async verifySetup() {
        try {
            const { setupRequired } = await checkSetupStatusRequest();
            if (!setupRequired) {
                document.title = "404 Not Found";
                document.body.innerHTML = '<div style="display:flex; height:100vh; align-items:center; justify-content:center; color:white; font-family:sans-serif; background-color: #0f172a;"><h1 style="font-size: 2rem; font-weight: bold;">404 - Page Introuvable</h1></div>';
            }
        } catch (e) {
            console.error("Erreur de vérification du setup:", e);
        }
    }

    initDOM() {
        this.form = document.querySelector('form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordConfirmInput = document.getElementById('password_confirm');

        // error/success banner
        this.messageDiv = document.getElementById('message-div');
        if (!this.messageDiv && this.form) {
            this.messageDiv = document.createElement('div');
            this.messageDiv.id = 'message-div';
            this.messageDiv.className = 'text-sm font-medium mb-4 text-center hidden p-3 rounded-lg';
            this.form.prepend(this.messageDiv);
        }
    }

    initEvents() {
        this.setupPasswordToggle('password', 'toggle-password');
        this.setupPasswordToggle('password_confirm', 'toggle-password-confirm');

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    setupPasswordToggle(inputId, toggleBtnId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(toggleBtnId);
        if (input && btn) {
            btn.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                const eyeIcon = btn.querySelector('.eye-icon');
                const eyeOffIcon = btn.querySelector('.eye-off-icon');
                
                if (type === 'text') {
                    if (eyeIcon) eyeIcon.classList.add('hidden');
                    if (eyeOffIcon) eyeOffIcon.classList.remove('hidden');
                } else {
                    if (eyeIcon) eyeIcon.classList.remove('hidden');
                    if (eyeOffIcon) eyeOffIcon.classList.add('hidden');
                }
            });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // reset message
        this.messageDiv.classList.add('hidden');
        this.messageDiv.classList.remove('bg-red-500/10', 'text-red-500', 'bg-green-500/10', 'text-green-500');
        this.messageDiv.textContent = '';

        const email = this.emailInput.value;
        const password = this.passwordInput.value;
        const passwordConfirm = this.passwordConfirmInput.value;

        if (password !== passwordConfirm) {
            this.messageDiv.textContent = "Les mots de passe ne correspondent pas.";
            this.messageDiv.classList.add('bg-red-500/10', 'text-red-500');
            this.messageDiv.classList.remove('hidden');
            return;
        }

        if (password.length < 8) {
            this.messageDiv.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
            this.messageDiv.classList.add('bg-red-500/10', 'text-red-500');
            this.messageDiv.classList.remove('hidden');
            return;
        }

        try {
            const data = await setupAdminRequest(email, password);
            
            this.messageDiv.textContent = data.message || 'Compte admin créé avec succès ! Redirection...';
            this.messageDiv.classList.add('bg-green-500/10', 'text-green-500');
            this.messageDiv.classList.remove('hidden');

            this.emailInput.blur();
            this.passwordInput.blur();
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            this.messageDiv.textContent = error.message || 'Erreur lors de la création du compte administrateur.';
            this.messageDiv.classList.add('bg-red-500/10', 'text-red-500');
            this.messageDiv.classList.remove('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SetupPage();
});
