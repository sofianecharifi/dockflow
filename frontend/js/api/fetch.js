import { getToken, saveToken, clearToken } from '../auth.store.js';

const isApp = window.Capacitor || window.__TAURI__ || (window.navigator && window.navigator.userAgent.includes('Electron'));
export let API_BASE = '';
if (isApp) {
    API_BASE = localStorage.getItem('dockflow_api_url');
}

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

/**
 * Fetch wrapper that automatically adds the Authorization header
 * and attempts to refresh the token on a 401 response.
 */
export async function fetchWithAuth(url, options = {}) {
    let token = getToken();
    
    // Add default headers
    options.headers = options.headers || {};
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Always include credentials to send cookies (like refresh token)
    options.credentials = 'include';

    let response = await fetch(url, options);

    // If unauthorized, try to refresh the token
    if (response.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;
            try {
                const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, { 
                    method: 'POST', 
                    credentials: 'include' 
                });
                
                if (!refreshRes.ok) {
                    throw new Error('Refresh failed');
                }
                
                const data = await refreshRes.json();
                if (data.token) {
                    saveToken(data.token);
                    onRefreshed(data.token);
                } else {
                    throw new Error('No token returned');
                }
            } catch (err) {
                console.error("Token refresh failed", err);
                clearToken();
                // Redirect to login if token refresh fails completely
                if (!window.location.href.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                onRefreshed(null);
            } finally {
                isRefreshing = false;
            }
        }

        // Wait for the token refresh process to finish
        const newToken = await new Promise(resolve => {
            refreshSubscribers.push(resolve);
        });

        if (newToken) {
            // Update the header with the new token and retry the request
            options.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, options);
        }
    }

    return response;
}
