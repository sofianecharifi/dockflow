const API_BASE = window.Capacitor ? 'https://dockflow.mycharifi.ovh' : '';

export async function loginRequest(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
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
    const response = await fetch(`${API_BASE}/api/auth/setup/status`);
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
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la création du compte admin");
    }

    return data;
}