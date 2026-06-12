import { loginRequest, checkSetupStatusRequest } from '../api/auth.api.js';

// Check if setup is required before showing login
async function checkSetup() {
    try {
        const { setupRequired } = await checkSetupStatusRequest();
        if (setupRequired) {
            window.location.href = '/setup.html';
        }
    } catch (error) {
        console.error("Erreur lors de la vérification de l'installation:", error);
    }
}
checkSetup();


const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

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
        // login
        const data = await loginRequest(email, password);
        
        // save token
        localStorage.setItem('dockflow_token', data.token);

        emailInput.blur();
        passwordInput.blur();
        
        // redirect
        window.location.href = '/index.html';
        
    } catch (error) {
        // catch err
        console.error('Erreur lors de la connexion :', error);
        errorDiv.textContent = error.message || 'Erreur de connexion. Vérifiez vos identifiants.';
        errorDiv.classList.remove('hidden');
    }
});