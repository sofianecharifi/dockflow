import { setupAdminRequest } from '../api/auth.api.js';

const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password_confirm');

// Toggle password visibility helper
function setupPasswordToggle(inputId, toggleBtnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(toggleBtnId);
    if (input && btn) {
        btn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            const eyeIcon = btn.querySelector('.eye-icon');
            const eyeOffIcon = btn.querySelector('.eye-off-icon');
            
            if (type === 'text') {
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        });
    }
}

setupPasswordToggle('password', 'toggle-password');
setupPasswordToggle('password_confirm', 'toggle-password-confirm');

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
    const passwordConfirm = passwordConfirmInput.value;

    if (password !== passwordConfirm) {
        messageDiv.textContent = "Les mots de passe ne correspondent pas.";
        messageDiv.classList.add('bg-red-500/10', 'text-red-500');
        messageDiv.classList.remove('hidden');
        return;
    }

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
            window.location.href = 'login.html';
        }, 1500);
        
    } catch (error) {
        // catch err
        console.error('Erreur lors de la création:', error);
        messageDiv.textContent = error.message || 'Erreur lors de la création du compte administrateur.';
        messageDiv.classList.add('bg-red-500/10', 'text-red-500');
        messageDiv.classList.remove('hidden');
    }
});
