import * as client from './client';

// Only non-sensitive profile info is kept in localStorage.
// The JWT lives exclusively in the server-set httpOnly cookie.
const USER_KEY = 'immo_user';

/**
 * Authenticate with email + password.
 * The server responds with:
 *  - Set-Cookie: immo_token=<jwt>; HttpOnly; SameSite=Lax  (auth credential)
 *  - JSON body: { id, name, email, role, agentId, avatar }  (profile info)
 *
 * We persist ONLY the non-sensitive profile info to localStorage so the UI
 * can restore the logged-in state after a page refresh without a round-trip.
 * The actual JWT never touches localStorage.
 */
export async function login(email, password) {
  const data = await client.post('/api/auth/login', { email, password });

  // Store only non-sensitive fields — no token
  const safeUser = {
    id:      data.id,
    name:    data.name,
    email:   data.email,
    role:    data.role,
    agentId: data.agentId ?? null,
    avatar:  data.avatar  ?? null,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(safeUser));

  return safeUser;
}

/**
 * Ask the server to clear the auth cookie (maxAge=0), then wipe local state.
 * We attempt the server call but always clean up locally even if it fails
 * (e.g. network error), so the user is never stuck in a logged-in UI state.
 */
export async function logout() {
  try {
    await client.post('/api/auth/logout');
  } catch {
    // Server unreachable — still clear local state
  } finally {
    localStorage.removeItem(USER_KEY);
  }
}

/** Full agent/user profile from the server (requires valid cookie). */
export function getMe() {
  return client.get('/api/auth/me');
}

export function changePassword(currentPassword, newPassword) {
  return client.patch('/api/auth/change-password', { currentPassword, newPassword });
}

/**
 * Reads the cached non-sensitive user info from localStorage.
 * Used on app boot to restore the logged-in UI state without a server call.
 * The auth cookie is handled transparently by the browser — no token needed here.
 */
export function getSavedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
