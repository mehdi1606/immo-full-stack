/**
 * Centralized HTTP client for ImmoMaroc API
 * Base URL : http://localhost:8090
 * Auth     : httpOnly cookie "immo_token" set by the server on login
 *            (credentials: 'include' sends it automatically on every request)
 *            Authorization header is NOT used by browser clients any more —
 *            the server still accepts it for Postman / API clients.
 * Lang     : ?lang= appended automatically from i18n
 */

import i18n from '../i18n';

// In Docker: VITE_API_URL is '' → relative URLs → Nginx proxy handles it
// In dev:    Vite proxy forwards /api and /uploads to localhost:8090
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLang() {
  const lang = i18n.language || 'fr';
  return lang.split('-')[0]; // 'fr-FR' → 'fr'
}

function buildUrl(path, params = {}) {
  const lang = getLang();
  const allParams = { lang, ...params };
  const qs = Object.entries(allParams)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

/**
 * Returns headers for JSON requests.
 * No Authorization header — auth is handled by the httpOnly cookie.
 */
function buildHeaders(isMultipart = false) {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function handleResponse(res) {
  if (res.status === 401) {
    // Session expired or cookie cleared — tell the app to reset state.
    // The cookie itself is already invalid; no client-side token to remove.
    localStorage.removeItem('immo_user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      message = data.message || data.error || message;
    } catch {
      // body not JSON — keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return null; // No Content

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
// credentials: 'include' → browser sends the httpOnly cookie on cross-origin
// requests to the backend (allowed because CorsConfig sets allowCredentials=true
// with an explicit origin allowlist, not a wildcard).

export async function get(path, params = {}) {
  const res = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function post(path, body = {}, isMultipart = false) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders(isMultipart),
    body: isMultipart ? body : JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function put(path, body = {}, isMultipart = false) {
  const res = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: buildHeaders(isMultipart),
    body: isMultipart ? body : JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function patch(path, body = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'PATCH',
    headers: buildHeaders(),
    body: JSON.stringify(body),
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function del(path) {
  const res = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  });
  return handleResponse(res);
}

export const API_BASE_URL = BASE_URL;
