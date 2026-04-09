import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Phone, MessageSquare, Search, CheckCircle2, XCircle, Clock, UserCheck, FileText, X, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllSellRequests, updateSellRequestStatus, assignSellRequest } from '../../api/sellRequests';
import { getAllAgents } from '../../api/agents';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const STATUS_CFG = {
  nouveau:    { label: 'Nouveau',    icon: Clock,        badge: 'bg-blue-100 text-blue-700',     strip: 'bg-blue-50 border-blue-200'   },
  'en cours': { label: 'En cours',   icon: UserCheck,    badge: 'bg-amber-100 text-amber-700',   strip: 'bg-amber-50 border-amber-200' },
  traité:     { label: 'Traité',     icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700', strip: 'bg-emerald-50 border-emerald-200' },
  rejeté:     { label: 'Rejeté',     icon: XCircle,      badge: 'bg-red-100 text-red-600',       strip: 'bg-red-50 border-red-200'     },
};
const STATUSES = ['nouveau', 'en cours', 'traité', 'rejeté'];

export default function SellRequests() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [sellRequests, setSellRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([getAllSellRequests(), getAllAgents()])
      .then(([srData, agData]) => {
        setSellRequests(srData?.content ?? (Array.isArray(srData) ? srData : []));
        setAgents(agData?.content ?? (Array.isArray(agData) ? agData : []));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData);

  const filtered = sellRequests
    .filter(r => !filterStatus || r.status === filterStatus || r.status?.toLowerCase() === filterStatus)
    .filter(r => !q || (r.fullName || r.name || '').toLowerCase().includes(q.toLowerCase()) || r.city?.toLowerCase().includes(q.toLowerCase()));

  const changeStatus = async (id, status) => {
    try {
      await updateSellRequestStatus(id, status);
      setSellRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch { /* ignore */ }
  };

  const assignAgent = async (id, agentId) => {
    try {
      await assignSellRequest(id, agentId);
      setSellRequests(prev => prev.map(r => r.id === id ? { ...r, assignedAgent: Number(agentId), assignedAgentId: Number(agentId) } : r));
    } catch { /* ignore */ }
  };

  const selectedReq = selected !== null ? sellRequests.find(r => r.id === selected) : null;
  const activeAgents = agents.filter(a => a.status === 'active' || a.enabled);

  const getAssignedAgent = (req) => {
    const aid = req.assignedAgent ?? req.assignedAgentId;
    return aid ? agents.find(a => a.id === Number(aid)) : null;
  };

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = sellRequests.filter(r => r.status === s || r.status?.toLowerCase() === s).length;
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('admin.sellRequests.title')}</h1>
        <p className="text-neutral-500 text-sm mt-0.5">{sellRequests.length} demande{sellRequests.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* ── Status summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map(key => {
          const cfg = STATUS_CFG[key];
          const Icon = cfg.icon;
          const active = filterStatus === key;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(active ? '' : key)}
              className={`rounded-2xl p-4 text-left border-2 transition-all ${cfg.strip} ${active ? 'ring-2 ring-current' : 'hover:shadow-sm'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={16} className="opacity-70" />
                {active && <span className="text-[10px] font-bold uppercase tracking-wide opacity-60">Filtré</span>}
              </div>
              <p className="text-2xl font-bold">{counts[key]}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            style={{ fontSize: '16px' }}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary transition-all"
            placeholder="Nom, ville…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select
          style={{ fontSize: '16px' }}
          className="h-10 px-3 pe-8 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary appearance-none text-neutral-600"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{STATUS_CFG[s].label}</option>)}
        </select>
        {(q || filterStatus) && (
          <button
            onClick={() => { setQ(''); setFilterStatus(''); }}
            className="h-10 px-3 rounded-xl text-xs font-medium text-neutral-500 hover:text-red-500 hover:bg-red-50 transition-colors border border-neutral-200 flex items-center gap-1.5"
          >
            <X size={13} /> Réinitialiser
          </button>
        )}
        <span className="text-xs text-neutral-400 ml-auto">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Two-panel layout ── */}
      <div className={`grid gap-5 ${selectedReq ? 'lg:grid-cols-5' : 'grid-cols-1'}`}>

        {/* Left: list */}
        <div className={selectedReq ? 'lg:col-span-2' : 'col-span-1'}>
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <FileText size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-neutral-600">Aucune demande trouvée</p>
                <p className="text-sm mt-1">Modifiez vos filtres de recherche</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filtered.map(req => {
                  const cfg = STATUS_CFG[req.status?.toLowerCase()] || STATUS_CFG['nouveau'];
                  const Icon = cfg.icon;
                  const assignedAgent = getAssignedAgent(req);
                  const isSelected = selected === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelected(isSelected ? null : req.id)}
                      className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-neutral-50 border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                            {(req.fullName || req.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 text-sm truncate">{req.fullName || req.name}</p>
                            <p className="text-neutral-400 text-xs">{req.city} · {req.type} · {req.purpose}</p>
                            {assignedAgent && (
                              <p className="text-primary text-xs mt-0.5 flex items-center gap-1">
                                <UserCheck size={10} /> {assignedAgent.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${cfg.badge}`}>
                            <Icon size={9} /> {cfg.label}
                          </span>
                          <span className="text-neutral-400 text-[10px]">{req.createdAt?.slice(0, 10)}</span>
                        </div>
                      </div>
                      {req.message && (
                        <p className="text-neutral-400 text-xs mt-2 line-clamp-1 pl-13">{req.message}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail */}
        {selectedReq && (() => {
          const cfg = STATUS_CFG[selectedReq.status?.toLowerCase()] || STATUS_CFG['nouveau'];
          return (
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 sticky top-6 space-y-5">

                {/* Detail header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-neutral-900 text-lg">{selectedReq.fullName || selectedReq.name}</h3>
                    <p className="text-neutral-400 text-sm mt-0.5">Demande du {selectedReq.createdAt?.slice(0, 10)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Email',     value: selectedReq.email },
                    { label: 'Téléphone', value: selectedReq.phone },
                    { label: 'Ville',     value: selectedReq.city },
                    { label: 'Type',      value: selectedReq.type },
                    { label: 'Opération', value: selectedReq.purpose },
                  ].filter(f => f.value).map(({ label, value }) => (
                    <div key={label} className="bg-neutral-50 rounded-xl p-3">
                      <p className="text-neutral-400 text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="font-semibold text-neutral-800 text-sm">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Message */}
                {selectedReq.message && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-neutral-400 text-[10px] uppercase tracking-wide mb-1.5">Message</p>
                    <p className="text-neutral-700 text-sm leading-relaxed">{selectedReq.message}</p>
                  </div>
                )}

                {/* Assign agent */}
                <div>
                  <p className="text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wide">Assigner un agent</p>
                  <select
                    style={{ fontSize: '16px' }}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary appearance-none text-neutral-700"
                    value={selectedReq.assignedAgent ?? selectedReq.assignedAgentId ?? ''}
                    onChange={e => assignAgent(selectedReq.id, e.target.value)}
                  >
                    <option value="">Non assigné</option>
                    {activeAgents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} – {a.city}</option>
                    ))}
                  </select>
                </div>

                {/* Quick actions */}
                <div className="flex gap-3 pt-2 border-t border-neutral-100">
                  <a
                    href={`tel:${selectedReq.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-sm font-medium transition-colors"
                  >
                    <Phone size={14} /> Appeler
                  </a>
                  <a
                    href={`https://wa.me/${selectedReq.phone?.replace(/\s+/g,'').replace('+','')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-sm font-medium transition-colors"
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
