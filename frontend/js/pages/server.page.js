import '../theme.js';
// Restrict this page to Tauri or Capacitor environments
if (!window.__TAURI__ && !window.Capacitor) {
    window.location.href = 'login.html';
}

const form = document.querySelector('form');
const urlInput = document.getElementById('server_url');

let errorDiv = document.getElementById('error-message');
if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.className = 'text-red-500 text-sm font-medium mb-4 text-center hidden';
    form.prepend(errorDiv);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');
    
    let url = urlInput.value.trim();
    // remove trailing slash
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        errorDiv.textContent = "L'URL doit commencer par http:// ou https://";
        errorDiv.classList.remove('hidden');
        return;
    }

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Vérification...';

        // try to reach the server to check if it's a dockflow instance
        const response = await fetch(`${url}/api/auth/setup/status`);
        if (!response.ok) throw new Error("Serveur injoignable ou invalide");
        
        // save to localstorage
        localStorage.setItem('dockflow_api_url', url);
        
        // redirect to login
        window.location.href = 'login.html';
    } catch (error) {
        errorDiv.textContent = "Impossible de se connecter au serveur. Vérifiez l'URL.";
        errorDiv.classList.remove('hidden');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enregistrer';
    }
});
