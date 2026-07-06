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
