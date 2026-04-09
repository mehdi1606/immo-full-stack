import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as authApi from '../api/auth';
import * as favApi  from '../api/favorites';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Auth ──────────────────────────────────────────────────────
  const [user, setUser]           = useState(() => authApi.getSavedUser());
  const [authError, setAuthError] = useState('');

  // ── Favorites (array of property IDs) ─────────────────────────
  const [favorites, setFavorites] = useState([]);

  // ── Search filters (shared across pages) ──────────────────────
  const [filters, setFilters] = useState({
    q: '', city: '', type: '', purpose: '', status: '',
    minPrice: '', maxPrice: '', minRooms: '', condition: '', rentalPeriod: '',
  });

  // ── Listen for auto-logout (401) triggered from client.js ─────
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setFavorites([]);
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  // ── Load favorites when user is authenticated ─────────────────
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    favApi.getMyFavorites()
      .then(data => {
        if (Array.isArray(data)) {
          // Backend may return objects with id/propertyId, or plain IDs
          setFavorites(data.map(f => (typeof f === 'object' ? (f.propertyId ?? f.id) : f)));
        }
      })
      .catch(() => setFavorites([]));
  }, [user]);

  // ── Auth actions ──────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      setAuthError('');
      const data = await authApi.login(email, password);
      setUser(data);
      return { success: true, role: data.role };
    } catch (err) {
      const msg = err.message || 'Email ou mot de passe incorrect';
      setAuthError(msg);
      return { success: false };
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout(); // clears server-side cookie + local immo_user
    setUser(null);
    setFavorites([]);
    setAuthError('');
  }, []);

  // ── Favorites actions ─────────────────────────────────────────
  const toggleFavorite = useCallback(async (propertyId) => {
    if (!user) return; // Must be logged in
    const isFav = favorites.includes(propertyId);
    // Optimistic update
    setFavorites(prev =>
      isFav ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    );
    try {
      if (isFav) {
        await favApi.removeFavorite(propertyId);
      } else {
        await favApi.addFavorite(propertyId);
      }
    } catch {
      // Revert on error
      setFavorites(prev =>
        isFav ? [...prev, propertyId] : prev.filter(id => id !== propertyId)
      );
    }
  }, [favorites, user]);

  return (
    <AppContext.Provider value={{
      // auth
      user, login, logout, authError,
      // favorites
      favorites, toggleFavorite,
      // filters (shared state for Search page)
      filters, setFilters,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
