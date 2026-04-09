import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from './AppContext';
import { API_BASE_URL } from '../api/client';
import { getAllLeads, getMyLeads } from '../api/leads';
import { getAllSellRequests } from '../api/sellRequests';

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 50;

// ── Convert a Lead API response → notification object ───────────────────────
function leadToNotif(lead) {
  return {
    id:        `LEAD-${lead.id}`,
    type:      'LEAD',
    entityId:  lead.id,
    name:      lead.name,
    subject:   lead.propertyTitle || null,
    timestamp: lead.createdAt ? new Date(lead.createdAt) : new Date(),
    read:      true,   // historical — already existed before this session
  };
}

// ── Convert a SellRequest API response → notification object ─────────────────
function sellReqToNotif(sr) {
  return {
    id:        `SELL_REQUEST-${sr.id}`,
    type:      'SELL_REQUEST',
    entityId:  sr.id,
    name:      sr.name,
    subject:   sr.city || null,
    timestamp: sr.createdAt ? new Date(sr.createdAt) : new Date(),
    read:      true,   // historical
  };
}

export function NotificationProvider({ children }) {
  const { user } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const eventSourceRef    = useRef(null);
  const reconnectTimerRef = useRef(null);

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'AGENT';
  const isConnectable = isAdmin || isAgent;

  // ── Fetch existing leads (+ sell-requests for admin) on mount ─────────────
  useEffect(() => {
    if (!isConnectable) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function fetchExisting() {
      try {
        if (isAdmin) {
          // Admin: all leads + all sell-requests, merged and sorted newest first
          const [leadsRes, srRes] = await Promise.allSettled([
            getAllLeads(),
            getAllSellRequests(),
          ]);

          const leads = leadsRes.status === 'fulfilled'
            ? (Array.isArray(leadsRes.value) ? leadsRes.value : []).map(leadToNotif)
            : [];

          const sellReqs = srRes.status === 'fulfilled'
            ? (Array.isArray(srRes.value) ? srRes.value : []).map(sellReqToNotif)
            : [];

          const merged = [...leads, ...sellReqs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_NOTIFICATIONS);

          if (!cancelled) setNotifications(merged);

        } else {
          // Agent: only their own leads
          const res = await getMyLeads();
          const leads = (Array.isArray(res) ? res : [])
            .map(leadToNotif)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_NOTIFICATIONS);

          if (!cancelled) setNotifications(leads);
        }
      } catch {
        // Silently ignore — SSE will still deliver new ones in real time
      }
    }

    fetchExisting();
    const intervalId = setInterval(fetchExisting, 60_000); // re-sync every 60 s
    return () => { cancelled = true; clearInterval(intervalId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnectable, user?.id]);

  // ── Add a notification received from SSE ──────────────────────────────────
  const addNotification = useCallback((payload) => {
    const notif = {
      id:       `${payload.type}-${payload.id}-${Date.now()}`,
      type:     payload.type,       // "LEAD" | "SELL_REQUEST"
      entityId: payload.id,
      name:     payload.name,
      subject:  payload.subject,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      read:     false,
    };

    setNotifications(prev => {
      // Avoid duplicate if the historical fetch already loaded this entity
      const historicalKey = `${notif.type}-${notif.entityId}`;
      const filtered = prev.filter(n => n.id !== historicalKey);
      return [notif, ...filtered].slice(0, MAX_NOTIFICATIONS);
    });
    setUnreadCount(prev => prev + 1);

    // Browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = notif.type === 'LEAD' ? '📩 Nouveau lead' : '🏠 Nouvelle demande';
      const body  = `${notif.name}${notif.subject ? ` — ${notif.subject}` : ''}`;
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // ── Build SSE URL depending on role ──────────────────────────────────────
  // No token in URL — EventSource sends the httpOnly cookie automatically
  // when withCredentials: true is set (see connect() below).
  const buildUrl = useCallback(() => {
    if (!user?.id) return null;
    const clientId = `${user?.role?.toLowerCase()}-${user?.id}-${Date.now()}`;
    const path     = isAdmin
      ? '/api/notifications/stream'
      : '/api/notifications/agent/stream';
    return `${API_BASE_URL}${path}?clientId=${clientId}`;
  }, [isAdmin, user?.id, user?.role]);

  // ── Open EventSource connection ───────────────────────────────────────────
  const connect = useCallback(() => {
    if (!isConnectable) return;
    const url = buildUrl();
    if (!url) return; // user not yet loaded

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // withCredentials: true → browser sends the httpOnly auth cookie with the SSE request
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      console.info(`[Notifications] SSE connected (${user?.role})`);
    };

    es.addEventListener('notification', (event) => {
      try {
        addNotification(JSON.parse(event.data));
      } catch (err) {
        console.warn('[Notifications] Failed to parse SSE event', err);
      }
    });

    es.onerror = () => {
      console.warn('[Notifications] SSE error — reconnecting in 5 s');
      es.close();
      eventSourceRef.current = null;
      reconnectTimerRef.current = setTimeout(() => {
        if (isConnectable) connect();
      }, 5000);
    };

    eventSourceRef.current = es;
  }, [isConnectable, buildUrl, addNotification, user?.role]);

  // ── Lifecycle: connect SSE when user is ADMIN or AGENT ───────────────────
  useEffect(() => {
    if (isConnectable) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      connect();
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }

    return () => {
      clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnectable, user?.id]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
