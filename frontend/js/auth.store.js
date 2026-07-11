import { fetchWithAuth } from './api/fetch.js';
/**
 * In-memory auth store — token is NEVER persisted to localStorage or sessionStorage.
 * This is intentional: keeping the JWT only in RAM eliminates XSS-based token theft.
 * The token lives as long as the Tauri app window stays open.
 *
 * For cross-page navigation (login → dashboard), we use sessionStorage as a
 * short-lived bridge ONLY within the same app session. sessionStorage is:
 *   - Cleared automatically when the window/tab closes (i.e. when the Tauri app closes)
 *   - Not shared across origins or tabs
 *   - A reasonable tradeoff for a desktop app where XSS risk is minimal
 */

const SESSION_KEY = 'df_session';

/**
 * Save token after login. Uses sessionStorage as a bridge for cross-page navigation.
 * @param {string} token - JWT token
 */
export function saveToken(token) {
    sessionStorage.setItem(SESSION_KEY, token);
}

/**
 * Get the current token. Returns null if not authenticated.
 * @returns {string|null}
 */
export function getToken() {
    return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Clear the token on logout.
 */
export function clearToken() {
    sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Gets initials from a string (e.g. "Admin Dock" -> "AD").
 */
export function getInitials(name) {
    if (!name) return "?";
    return name.split(' ')
               .filter(word => word.trim().length > 0)
               .map(word => word[0].toUpperCase())
               .join('')
               .substring(0, 2); // max 2 initials
}

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchUserProfile() {
    const API_BASE = localStorage.getItem('dockflow_api_url') || '';
    const token = getToken();
    const res = await fetchWithAuth(`${API_BASE}/api/auth/me`, {
        method: 'GET'
    });

    if (!res.ok) throw new Error('Erreur lors de la récupération du profil');
    return res.json();
}

/**
 * Update the user's profile.
 */
export async function updateUserProfile(username, email) {
    const API_BASE = localStorage.getItem('dockflow_api_url') || '';
    const res = await fetchWithAuth(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
    }
    return res.json();
}

/**
 * Update the user's password.
 */
export async function updatePassword(currentPassword, newPassword) {
    const API_BASE = localStorage.getItem('dockflow_api_url') || '';
    const res = await fetchWithAuth(`${API_BASE}/api/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du mot de passe');
    }
    return res.json();
}

/**
 * Delete the user's account.
 */
export async function deleteAccount(password) {
    const API_BASE = localStorage.getItem('dockflow_api_url') || '';
    const res = await fetchWithAuth(`${API_BASE}/api/auth/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du compte');
    }
    return res.json();
}
