import { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, Search, Clock, CheckCircle2, Eye, MessageSquare, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? '';

const STATUS_STYLE = {
  NOUVEAU:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LU:       'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  REPONDU:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const STATUS_LABEL = {
  NOUVEAU: 'Nouveau',
  LU:      'Lu',
  REPONDU: 'Répondu',
};

const STATUS_ICON = {
  NOUVEAU: Clock,
  LU:      Eye,
  REPONDU: CheckCircle2,
};

function fmt(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('fr-MA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ContactMessages() {
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [q, setQ]                       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected]         = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      const url = filterStatus
        ? `${API}/api/contact?status=${filterStatus}`
        : `${API}/api/contact`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setMessages(await res.json());
      setError('');
    } catch {
      setError('Impossible de charger les messages.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const openMessage = async (msg) => {
    setSelected(msg);
    if (msg.status === 'NOUVEAU') {
      try {
        const res = await fetch(`${API}/api/contact/${msg.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'LU' }),
        });
        if (res.ok) {
          const updated = await res.json();
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelected(updated);
        }
      } catch { /* silent */ }
    }
  };

  const markAs = async (id, status) => {
    try {
      const res = await fetch(`${API}/api/contact/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        if (selected?.id === updated.id) setSelected(updated);
      }
    } catch { /* silent */ }
  };

  const filtered = messages.filter(m => {
    const q2 = q.toLowerCase();
    return !q || m.name.toLowerCase().includes(q2) || m.email.toLowerCase().includes(q2) || m.subject.toLowerCase().includes(q2);
  });

  const counts = {
    NOUVEAU: messages.filter(m => m.status === 'NOUVEAU').length,
    LU:      messages.filter(m => m.status === 'LU').length,
    REPONDU: messages.filter(m => m.status === 'REPONDU').length,
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Messages de contact</h1>
        <p className="text-neutral-500 dark:text-slate-400 text-sm">{messages.length} message{messages.length !== 1 ? 's' : ''} reçu{messages.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'NOUVEAU', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'       },
          { key: 'LU',      color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'     },
          { key: 'REPONDU', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' },
        ].map(({ key, color }) => (
          <button key={key}
            onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
            className={`rounded-2xl p-4 text-left transition-all ${color} ${filterStatus === key ? 'ring-2 ring-current' : ''}`}>
            <div className="font-serif text-2xl font-bold">{counts[key]}</div>
            <div className="text-xs mt-1 opacity-80">{STATUS_LABEL[key]}</div>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500" />
          <input
            type="text"
            style={{ fontSize: '16px' }}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-900 dark:text-slate-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
            placeholder="Nom, email, sujet…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select
          style={{ fontSize: '16px' }}
          className="h-10 px-3 pe-8 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-600 dark:text-slate-300 focus:outline-none focus:border-primary appearance-none"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="NOUVEAU">Nouveau</option>
          <option value="LU">Lu</option>
          <option value="REPONDU">Répondu</option>
        </select>
        {(q || filterStatus) && (
          <button onClick={() => { setQ(''); setFilterStatus(''); }}
            className="h-10 px-3 rounded-xl text-xs font-medium text-neutral-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-neutral-200 dark:border-slate-700 flex items-center gap-1.5">
            <X size={13} /> Réinitialiser
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-5 py-4 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      <div className={`grid gap-6 ${selected ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1'}`}>
        {/* List */}
        <div className={selected ? 'lg:col-span-2' : ''}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-neutral-400 dark:text-slate-500">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 dark:text-slate-500">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucun message</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                {filtered.map(msg => {
                  const Icon = STATUS_ICON[msg.status] || Clock;
                  return (
                    <div key={msg.id}
                      onClick={() => openMessage(msg)}
                      className={`p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-800/60 transition-colors ${selected?.id === msg.id ? 'bg-primary/5 border-l-4 border-primary' : ''} ${msg.status === 'NOUVEAU' ? 'font-semibold' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                            {msg.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-neutral-900 dark:text-white text-sm truncate">{msg.name}</p>
                            <p className="text-neutral-400 dark:text-slate-500 text-xs truncate">{msg.subject}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${STATUS_STYLE[msg.status]}`}>
                            <Icon size={10} /> {STATUS_LABEL[msg.status]}
                          </span>
                          <span className="text-neutral-400 dark:text-slate-500 text-[10px]">{fmt(msg.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-neutral-400 dark:text-slate-500 text-xs mt-2 line-clamp-1">{msg.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 p-6 sticky top-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">{selected.name}</h3>
                  <p className="text-neutral-400 dark:text-slate-500 text-sm">{fmt(selected.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLE[selected.status]}`}>
                    {STATUS_LABEL[selected.status]}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-neutral-400 dark:text-slate-500 hover:text-neutral-600 dark:hover:text-slate-300 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Email',     value: selected.email },
                  { label: 'Téléphone', value: selected.phone || '-' },
                  { label: 'Sujet',     value: selected.subject },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-neutral-50 dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-neutral-400 dark:text-slate-500 text-xs mb-0.5">{label}</p>
                    <p className="font-medium text-neutral-900 dark:text-slate-200 text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-neutral-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wide">Message</p>
                <div className="bg-neutral-50 dark:bg-slate-800 rounded-xl p-4 text-sm text-neutral-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-neutral-100 dark:border-slate-700">
                  {selected.message}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-100 dark:border-slate-800">
                <a
                  href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(selected.email)}&su=${encodeURIComponent('Re: ' + selected.subject)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors flex-1 justify-center">
                  <Mail size={14} /> Répondre par Gmail
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-slate-300 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors text-sm">
                    <Phone size={14} /> Appeler
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <p className="text-xs text-neutral-400 dark:text-slate-500 w-full">Changer le statut :</p>
                {['NOUVEAU', 'LU', 'REPONDU'].filter(s => s !== selected.status).map(s => (
                  <button key={s}
                    onClick={() => markAs(selected.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80 ${STATUS_STYLE[s]}`}>
                    Marquer comme {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
