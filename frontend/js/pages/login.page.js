import '../theme.js';
import { loginRequest, checkSetupStatusRequest } from '../api/auth.api.js';
import { saveToken } from '../auth.store.js';

class LoginPage {
    constructor() {
        this.initDOM();
        this.initEvents();
        this.checkSetup();
    }

    initDOM() {
        this.form = document.querySelector('form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        
        // Setup error banner
        this.errorDiv = document.getElementById('error-message');
        if (!this.errorDiv && this.form) {
            this.errorDiv = document.createElement('div');
            this.errorDiv.id = 'error-message';
            this.errorDiv.className = 'text-red-500 text-sm font-medium mb-4 text-center hidden';
            this.form.prepend(this.errorDiv);
        }
    }

    initEvents() {
        if (this.togglePasswordBtn) {
            this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async checkSetup() {
        try {
            const { setupRequired } = await checkSetupStatusRequest();
            if (setupRequired) {
                window.location.href = 'setup.html';
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de l'installation:", error);
        }
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        this.passwordInput.setAttribute('type', type);
        
        const eyeIcon = this.togglePasswordBtn.querySelector('#eye-icon');
        const eyeOffIcon = this.togglePasswordBtn.querySelector('#eye-off-icon');
        
        if (type === 'text') {
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        this.errorDiv.classList.add('hidden');
        this.errorDiv.textContent = '';

        const email = this.emailInput.value;
        const password = this.passwordInput.value;

        try {
            const data = await loginRequest(email, password);
            
            if (data && data.token) {
                saveToken(data.token);
            }

            this.emailInput.blur();
            this.passwordInput.blur();
            
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Erreur lors de la connexion :', error);
            this.errorDiv.textContent = error.message || 'Erreur de connexion. Vérifiez vos identifiants.';
            this.errorDiv.classList.remove('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});