const API_BASE = window.Capacitor ? 'https://dockflow.mycharifi.ovh' : '';

export async function getContainers() {
    const response = await fetch(`${API_BASE}/api/containers`, {
        method: 'GET',
        credentials: 'include'
    });


    if (!response.ok) {
        // invalid auth
        if (response.status === 401) {
            throw new Error("Session expirée");
        }
        // fallback
        throw new Error("Impossible de récupérer les conteneurs.");
    }


    const data = await response.json();
    return data;
}

export async function actionContainer(id, action) {
    // map action to method
    const method = action === 'remove' ? 'DELETE' : 'POST';
    
    const url = action === 'remove' ? `${API_BASE}/api/containers/${id}` : `${API_BASE}/api/containers/${id}/${action}`;

    const response = await fetch(url, {
        method: method,
        credentials: 'include'
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Session expirée");
        }
        // get backend err
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erreur lors de l'action ${action}`);
    }

    return await response.json();
}