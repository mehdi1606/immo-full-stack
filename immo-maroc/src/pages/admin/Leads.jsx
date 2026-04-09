import { useState, useCallback, useEffect } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { getAllLeads, updateLeadStatus } from '../../api/leads';
import { getAllAgentsAdmin } from '../../api/agents';
import {
  Search, Phone, Mail, MessageSquare, Building2, User,
  Clock, CheckCircle, XCircle, Star, Loader2, AlertCircle,
  RefreshCw, Filter, ChevronRight,
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const STATUSES = ['NOUVEAU', 'CONTACTED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'];

const STATUS_CONFIG = {
  NOUVEAU:     { label: 'Nouveau',  color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  CONTACTED:   { label: 'Contacté', color: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  QUALIFIED:   { label: 'Qualifié', color: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500' },
  CLOSED_WON:  { label: 'Conclu',   color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  CLOSED_LOST: { label: 'Perdu',    color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
};

const KPI_STATUS = [
  { key: 'NOUVEAU',     label: 'Nouveaux',  icon: Clock,        color: 'text-blue-600',   bg: 'bg-blue-50',    ring: 'ring-blue-200'    },
  { key: 'CONTACTED',   label: 'Contactés', icon: Phone,        color: 'text-orange-600', bg: 'bg-orange-50',  ring: 'ring-orange-200'  },
  { key: 'QUALIFIED',   label: 'Qualifiés', icon: Star,         color: 'text-yellow-600', bg: 'bg-yellow-50',  ring: 'ring-yellow-200'  },
  { key: 'CLOSED_WON',  label: 'Conclus',   icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   ring: 'ring-green-200'   },
  { key: 'CLOSED_LOST', label: 'Perdus',    icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',     ring: 'ring-red-200'     },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

/* ─── Status Badge ───────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-neutral-100 text-neutral-600', dot: 'bg-neutral-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Lead Row ───────────────────────────────────────────────────────────── */

function LeadRow({ lead, selected, onClick }) {
  return (
    <tr
      onClick={() => onClick(lead)}
      className={`border-b border-neutral-100 cursor-pointer transition-colors ${
        selected ? 'bg-primary/5' : 'hover:bg-neutral-50'
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${STATUS_CONFIG[lead.status]?.color || 'bg-neutral-100 text-neutral-600'}`}>
            {getInitial(lead.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 text-sm truncate">{lead.name}</p>
            <p className="text-xs text-neutral-400 truncate">{lead.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
          <Building2 size={12} className="text-neutral-400 shrink-0" />
          <span className="truncate max-w-[160px]">{lead.propertyTitle || '—'}</span>
        </div>
        {lead.propertyCity && (
          <p className="text-xs text-neutral-400 mt-0.5 pl-[18px]">{lead.propertyCity}</p>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
          <User size={12} className="text-neutral-400 shrink-0" />
          <span>{lead.agentName || '—'}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={lead.status} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-neutral-400">
        {formatDate(lead.createdAt)}
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={14} className="text-neutral-300 ml-auto" />
      </td>
    </tr>
  );
}

/* ─── Detail Panel ───────────────────────────────────────────────────────── */

function LeadDetail({ lead, onClose, onStatusChange, updating }) {
  if (!lead) return null;
  const cfg = STATUS_CONFIG[lead.status] || {};
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-neutral-100 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${cfg.color || 'bg-neutral-100 text-neutral-600'}`}>
            {getInitial(lead.name)}
          </div>
          <div>
            <p className="font-bold text-neutral-900">{lead.name}</p>
            <StatusBadge status={lead.status} />
          </div>
        </div>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl leading-none mt-0.5">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Contact info */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Contact</p>
          <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm text-neutral-700">
            <Phone size={14} className="text-primary" /> {lead.phone || '—'}
          </a>
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm text-neutral-700">
            <Mail size={14} className="text-primary" /> {lead.email || '—'}
          </a>
        </div>

        {/* Property */}
        {lead.propertyTitle && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Bien concerné</p>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 text-sm text-neutral-700">
              <Building2 size={14} className="text-primary" />
              <div>
                <p className="font-medium">{lead.propertyTitle}</p>
                {lead.propertyCity && <p className="text-xs text-neutral-400">{lead.propertyCity}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Agent */}
        {lead.agentName && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Agent responsable</p>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 text-sm text-neutral-700">
              <User size={14} className="text-primary" />
              <span className="font-medium">{lead.agentName}</span>
            </div>
          </div>
        )}

        {/* Message */}
        {lead.message && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Message</p>
            <div className="flex gap-2.5 p-3 rounded-xl bg-neutral-50 text-sm text-neutral-600">
              <MessageSquare size={14} className="text-neutral-400 mt-0.5 shrink-0" />
              <p className="leading-relaxed">{lead.message}</p>
            </div>
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-neutral-400 flex items-center gap-1.5">
          <Clock size={11} /> Reçu le {formatDate(lead.createdAt)}
        </p>

        {/* Status update */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Changer le statut</p>
          <div className="grid grid-cols-1 gap-1.5">
            {STATUSES.map(s => {
              const c = STATUS_CONFIG[s];
              const isActive = lead.status === s;
              return (
                <button
                  key={s}
                  disabled={isActive || updating}
                  onClick={() => onStatusChange(s)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `${c.color} ring-1 ring-current/30 cursor-default`
                      : 'text-neutral-600 bg-neutral-50 hover:bg-neutral-100'
                  } disabled:opacity-60`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  {c.label}
                  {isActive && <CheckCircle size={13} className="ml-auto" />}
                  {updating && isActive && <Loader2 size={13} className="ml-auto animate-spin" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function AdminLeads() {
  const [leads, setLeads]           = useState([]);
  const [agents, setAgents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter]   = useState('');
  const [searchQ, setSearchQ]           = useState('');
  const [updating, setUpdating]         = useState(false);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([getAllLeads(), getAllAgentsAdmin()])
      .then(([leadsData, agentsData]) => {
        const list = Array.isArray(leadsData) ? leadsData : (leadsData?.content ?? []);
        setLeads(list);
        setAgents(Array.isArray(agentsData) ? agentsData : (agentsData?.content ?? []));
        setSelectedLead(prev => prev ? (list.find(l => l.id === prev.id) ?? null) : null);
      })
      .catch(err => setError(err?.message || 'Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useAutoRefresh(fetchLeads);

  /* ── Filters ── */
  const filtered = leads.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (agentFilter && String(l.agentId) !== agentFilter) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (
        !(l.name  || '').toLowerCase().includes(q) &&
        !(l.email || '').toLowerCase().includes(q) &&
        !(l.phone || '').toLowerCase().includes(q) &&
        !(l.propertyTitle || '').toLowerCase().includes(q) &&
        !(l.agentName || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  /* ── KPI counts ── */
  const counts = STATUSES.reduce((acc, s) => { acc[s] = leads.filter(l => l.status === s).length; return acc; }, {});

  /* ── Status change ── */
  const handleStatusChange = async (newStatus) => {
    if (!selectedLead || updating) return;
    setUpdating(true);
    try {
      await updateLeadStatus(selectedLead.id, newStatus);
      const updated = { ...selectedLead, status: newStatus };
      setSelectedLead(updated);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l));
    } catch { /* silent */ }
    finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-neutral-400">
      <Loader2 size={28} className="animate-spin text-primary" />
      <p className="text-sm">Chargement des leads…</p>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
        <button onClick={fetchLeads} className="flex items-center gap-1.5 text-xs text-red-600 underline">
          <RefreshCw size={13} /> Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Leads</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{leads.length} lead{leads.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={fetchLeads} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {KPI_STATUS.map(({ key, label, icon: Icon, color, bg, ring }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(prev => prev === key ? '' : key)}
            className={`rounded-2xl p-4 text-left transition-all ring-1 ${bg} ${ring} ${statusFilter === key ? 'ring-2' : ''}`}
          >
            <div className={`flex items-center gap-2 mb-1 ${color}`}>
              <Icon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{counts[key] ?? 0}</p>
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all"
            placeholder="Nom, email, bien, agent…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>

        <select
          className="h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary appearance-none pr-8 text-neutral-600"
          value={agentFilter}
          onChange={e => setAgentFilter(e.target.value)}
        >
          <option value="">Tous les agents</option>
          {agents.map(a => (
            <option key={a.id} value={String(a.id)}>{a.name}</option>
          ))}
        </select>

        <select
          className="h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary appearance-none pr-8 text-neutral-600"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>

        {(searchQ || statusFilter || agentFilter) && (
          <button
            onClick={() => { setSearchQ(''); setStatusFilter(''); setAgentFilter(''); }}
            className="h-10 px-3 rounded-xl text-xs font-medium text-neutral-500 hover:text-red-500 hover:bg-red-50 transition-colors border border-neutral-200"
          >
            Réinitialiser
          </button>
        )}
        <span className="text-xs text-neutral-400 ml-auto">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table + Detail panel ── */}
      <div className={`flex gap-4 ${selectedLead ? 'items-start' : ''}`}>

        {/* Table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-neutral-200" />
              <p className="font-semibold text-neutral-700">Aucun lead trouvé</p>
              <p className="text-sm text-neutral-400 mt-1">Modifiez vos filtres pour afficher plus de résultats</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/70">
                    <th className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 uppercase tracking-wide">Contact</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 uppercase tracking-wide hidden sm:table-cell">Bien</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 uppercase tracking-wide hidden md:table-cell">Agent</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 uppercase tracking-wide">Statut</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">Date</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      selected={selectedLead?.id === lead.id}
                      onClick={setSelectedLead}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedLead && (
          <div className="w-80 shrink-0 sticky top-6">
            <LeadDetail
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onStatusChange={handleStatusChange}
              updating={updating}
            />
          </div>
        )}
      </div>
    </div>
  );
}
