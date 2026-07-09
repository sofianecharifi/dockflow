import '../theme.js';
import { loginRequest, checkSetupStatusRequest } from '../api/auth.api.js';
import { saveToken } from '../auth.store.js';

// Check if setup is required before showing login
async function checkSetup() {
    try {
        const { setupRequired } = await checkSetupStatusRequest();
        if (setupRequired) {
            window.location.href = 'setup.html';
        }
    } catch (error) {
        console.error("Erreur lors de la vérification de l'installation:", error);
    }
}
checkSetup();


const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Toggle password visibility
const togglePasswordBtn = document.getElementById('toggle-password');
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const eyeIcon = togglePasswordBtn.querySelector('#eye-icon');
        const eyeOffIcon = togglePasswordBtn.querySelector('#eye-off-icon');
        
        if (type === 'text') {
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    });
}

// error banner
let errorDiv = document.getElementById('error-message');
if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'text-red-500 text-sm font-medium mb-4 text-center hidden';
    form.prepend(errorDiv);
}


form.addEventListener('submit', async (e) => {

    e.preventDefault();
    
    // reset error
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';


    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        // login — backend returns { message, token }
        const data = await loginRequest(email, password);
        
        // Store the token for WebSocket auth handshake (cross-origin in Tauri).
        // Stored in sessionStorage (cleared on app close), NOT localStorage.
        if (data && data.token) {
            saveToken(data.token);
        }

        emailInput.blur();
        passwordInput.blur();
        
        // redirect
        window.location.href = 'index.html';
        
    } catch (error) {
        // catch err
        console.error('Erreur lors de la connexion :', error);
        errorDiv.textContent = error.message || 'Erreur de connexion. Vérifiez vos identifiants.';
        errorDiv.classList.remove('hidden');
    }
});