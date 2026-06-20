const isApp = window.Capacitor || (window.navigator && window.navigator.userAgent.includes('Electron'));
let API_BASE = '';
if (isApp) {
    API_BASE = localStorage.getItem('dockflow_api_url');
    if (!API_BASE && !window.location.href.includes('server.html')) {
        window.location.href = 'server.html';
    }
}

export async function loginRequest(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    // Si le backend renvoie une erreur (401, 400, 500, etc.), on déclenche une exception
    if (!response.ok) {
        throw new Error(data.message || "Erreur de connexion");
    }

    return data;
}

export async function checkSetupStatusRequest() {
    const response = await fetch(`${API_BASE}/api/auth/setup/status`, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Erreur de vérification du statut");
    }
    return data;
}

export async function setupAdminRequest(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/setup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du compte admin");
    }

    return data;
}