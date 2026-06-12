import { setupAdminRequest } from '../api/auth.api.js';

const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// error/success banner
let messageDiv = document.getElementById('message-div');
if (!messageDiv) {
    messageDiv = document.createElement('div');
    messageDiv.id = 'message-div';
    messageDiv.className = 'text-sm font-medium mb-4 text-center hidden p-3 rounded-lg';
    form.prepend(messageDiv);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // reset message
    messageDiv.classList.add('hidden');
    messageDiv.classList.remove('bg-red-500/10', 'text-red-500', 'bg-green-500/10', 'text-green-500');
    messageDiv.textContent = '';

    const email = emailInput.value;
    const password = passwordInput.value;

    if (password.length < 8) {
        messageDiv.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
        messageDiv.classList.add('bg-red-500/10', 'text-red-500');
        messageDiv.classList.remove('hidden');
        return;
    }

    try {
        // create admin
        const data = await setupAdminRequest(email, password);
        
        messageDiv.textContent = data.message || 'Compte admin créé avec succès ! Redirection...';
        messageDiv.classList.add('bg-green-500/10', 'text-green-500');
        messageDiv.classList.remove('hidden');

        emailInput.blur();
        passwordInput.blur();
        
        // redirect to login after short delay
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        
    } catch (error) {
        // catch err
        console.error('Erreur lors de la création:', error);
        messageDiv.textContent = error.message || 'Erreur lors de la création du compte administrateur.';
        messageDiv.classList.add('bg-red-500/10', 'text-red-500');
        messageDiv.classList.remove('hidden');
    }
});
