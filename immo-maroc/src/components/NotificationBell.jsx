import { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Home, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/* ─── Format relative time ───────────────────────────────────────────────── */
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

/* ─── Single notification item ───────────────────────────────────────────── */
function NotifItem({ notif, onRead }) {
  const navigate = useNavigate();
  const { user } = useApp();
  const isLead = notif.type === 'LEAD';
  const isAgent = user?.role === 'AGENT';

  const handleClick = () => {
    onRead(notif.id);
    if (isLead) {
      navigate(isAgent ? '/agent/leads' : '/admin/leads');
    } else {
      navigate('/admin/demandes');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={[
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
        'hover:bg-gray-50 border-b border-gray-50 last:border-0',
        !notif.read ? 'bg-blue-50/40' : '',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={[
        'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5',
        isLead ? 'bg-blue-100' : 'bg-violet-100',
      ].join(' ')}>
        {isLead
          ? <MessageSquare size={15} className="text-blue-600" />
          : <Home size={15} className="text-violet-600" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 leading-snug">
          {isLead ? '📩 Nouveau lead' : '🏠 Nouvelle demande'}
        </p>
        <p className="text-xs text-gray-600 truncate mt-0.5">
          <span className="font-medium">{notif.name}</span>
          {notif.subject && <span className="text-gray-400"> — {notif.subject}</span>}
        </p>
        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.timestamp)}</p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
      )}
    </button>
  );
}

/* ─── Main bell component ────────────────────────────────────────────────── */
export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(prev => !prev);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    markAllRead();
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAll();
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell trigger button */}
      <button
        onClick={handleOpen}
        className={[
          'relative w-9 h-9 flex items-center justify-center rounded-xl transition-all',
          open
            ? 'bg-primary/10 text-primary'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800',
        ].join(' ')}
        aria-label="Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-[wiggle_0.4s_ease-in-out]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-400">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Tout marquer comme lu"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <Check size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Tout effacer"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
                <Bell size={32} className="opacity-40" />
                <p className="text-sm text-gray-400">Aucune notification</p>
                <p className="text-xs text-gray-300">Les nouvelles demandes et leads apparaîtront ici</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onRead={(id) => { markRead(id); setOpen(false); }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
              <p className="text-[10px] text-gray-400 text-center">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''} · Connexion SSE active
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
