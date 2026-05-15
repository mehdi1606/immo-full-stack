import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyLeads, updateLeadStatus } from '../../api/leads';
import {
  Phone, Mail, MessageSquare, User, Clock, ChevronRight,
  CheckCircle, XCircle, Star, Loader2, AlertCircle,
  Filter, RefreshCw, Search, Building2,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────── */

const STATUSES = ['NOUVEAU', 'CONTACTED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'];

const STATUS_CONFIG = {
  NOUVEAU:     { label: 'Nouveau',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',    dot: 'bg-blue-500',   border: 'border-blue-200 dark:border-blue-800'   },
  CONTACTED:   { label: 'Contacté', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  QUALIFIED:   { label: 'Qualifié', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', dot: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
  CLOSED_WON:  { label: 'Conclu',   color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',  dot: 'bg-green-500',  border: 'border-green-200 dark:border-green-800'  },
  CLOSED_LOST: { label: 'Perdu',    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',      dot: 'bg-red-500',    border: 'border-red-200 dark:border-red-800'    },
};

const AVATAR_BG = {
  NOUVEAU:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CONTACTED:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  QUALIFIED:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  CLOSED_WON:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CLOSED_LOST: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

/* ─── Status Badge ───────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot || 'bg-neutral-400'}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Pipeline Stepper ───────────────────────────────────────────── */

function PipelineStepper({ currentStatus }) {
  const idx = STATUSES.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-0">
      {STATUSES.map((s, i) => {
        const cfg      = STATUS_CONFIG[s];
        const isActive = i === idx;
        const isPast   = i < idx;
        return (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${isActive
                    ? `${cfg.dot} border-transparent text-white shadow-md`
                    : isPast
                      ? 'bg-neutral-200 dark:bg-slate-700 border-neutral-200 dark:border-slate-700 text-neutral-500 dark:text-slate-400'
                      : 'bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-300 dark:text-slate-600'
                  }`}
              >
                {isPast ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span
                className={`text-[9px] mt-1 font-semibold text-center leading-tight hidden sm:block truncate w-full px-1
                  ${isActive ? 'text-neutral-800 dark:text-slate-200' : 'text-neutral-400 dark:text-slate-600'}`}
              >
                {cfg.label}
              </span>
            </div>
            {i < STATUSES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-0.5 transition-colors ${isPast || isActive ? 'bg-neutral-300 dark:bg-slate-600' : 'bg-neutral-100 dark:bg-slate-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Lead Card (left panel) ─────────────────────────────────────── */

function LeadCard({ lead, isSelected, onClick }) {
  const cfg  = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NOUVEAU;
  const avBg = AVATAR_BG[lead.status]    || 'bg-neutral-100 text-neutral-600';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all
        ${isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-transparent bg-white dark:bg-slate-900 hover:border-neutral-200 dark:hover:border-slate-700 hover:shadow-sm'
        }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${avBg}`}>
          {getInitial(lead.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-neutral-800 dark:text-white'}`}>
              {lead.name || '—'}
            </p>
            <span className="text-xs text-neutral-400 dark:text-slate-500 shrink-0 flex items-center gap-0.5">
              <Clock size={10} />
              {lead.createdAt?.slice(0, 10)}
            </span>
          </div>

          <p className="text-neutral-500 dark:text-slate-400 text-xs truncate mb-2">
            {lead.propertyTitle || 'Annonce non précisée'}
          </p>

          <div className="flex items-center justify-between gap-2">
            <StatusBadge status={lead.status} />
            {lead.phone && (
              <span className="text-xs text-neutral-400 dark:text-slate-500 truncate">{lead.phone}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─── Lead Detail (right panel) ─────────────────────────────────── */

function LeadDetail({ lead, onStatusChange, updatingStatus }) {
  const avBg = AVATAR_BG[lead.status] || 'bg-neutral-100 text-neutral-600';
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-6 border-b border-neutral-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl ${avBg}`}>
            {getInitial(lead.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="font-bold text-neutral-900 dark:text-white text-lg">{lead.name}</h2>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-xs text-neutral-400 dark:text-slate-500 flex items-center gap-1">
              <Clock size={11} />
              Reçu le {formatDate(lead.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Property info */}
        {(lead.propertyTitle || lead.propertyCity) && (
          <div>
            <p className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-2">Annonce concernée</p>
            <Link
              to={`/propriete/${lead.propertyId}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-neutral-100 dark:border-slate-700 hover:border-primary/30 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-800 dark:text-slate-200 text-sm truncate group-hover:text-primary transition-colors">
                  {lead.propertyTitle}
                </p>
                {lead.propertyCity && (
                  <p className="text-neutral-400 dark:text-slate-500 text-xs">{lead.propertyCity}</p>
                )}
              </div>
              <ChevronRight size={14} className="text-neutral-400 dark:text-slate-500 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        )}

        {/* Contact info */}
        <div>
          <p className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-2">Coordonnées</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 dark:text-slate-500">Téléphone</p>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-slate-200 truncate group-hover:text-green-700 dark:group-hover:text-green-400">{lead.phone}</p>
                </div>
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 dark:text-slate-500">Email</p>
                  <p className="text-sm font-semibold text-neutral-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">{lead.email}</p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <p className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-2">Message</p>
          <div className="bg-neutral-50 dark:bg-slate-800 rounded-xl p-4 border border-neutral-100 dark:border-slate-700">
            {lead.message ? (
              <p className="text-neutral-700 dark:text-slate-300 text-sm leading-relaxed">{lead.message}</p>
            ) : (
              <p className="text-neutral-400 dark:text-slate-500 text-sm italic">Aucun message</p>
            )}
          </div>
        </div>

        {/* Pipeline stepper */}
        <div>
          <p className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-3">Pipeline</p>
          <PipelineStepper currentStatus={lead.status} />
        </div>

        {/* Status change */}
        <div>
          <p className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-3">Changer le statut</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => {
              const cfg       = STATUS_CONFIG[s];
              const isCurrent = lead.status === s;
              return (
                <button
                  key={s}
                  disabled={isCurrent || updatingStatus}
                  onClick={() => onStatusChange(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                    ${isCurrent
                      ? `${cfg.color} ${cfg.border} border cursor-default shadow-sm`
                      : 'bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                  {updatingStatus && isCurrent && (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="p-4 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap gap-2">
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <Phone size={14} /> Appeler
          </a>
        )}
        {lead.phone && (
          <a
            href={`https://wa.me/${lead.phone.replace(/[\s+\-()]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold transition-colors"
          >
            <MessageSquare size={14} /> WhatsApp
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
          >
            <Mail size={14} /> Email
          </a>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */

export default function AgentLeads() {
  const { i18n } = useTranslation();

  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQ, setSearchQ]           = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    setError('');
    getMyLeads(statusFilter || undefined)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        setLeads(list);
        setSelectedLead(prev => {
          if (!prev) return null;
          return list.find(l => l.id === prev.id) ?? null;
        });
      })
      .catch(err => setError(err?.message || 'Erreur lors du chargement des leads.'))
      .finally(() => setLoading(false));
  }, [statusFilter, i18n.language]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useAutoRefresh(fetchLeads);

  const filtered = leads.filter(l => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (
      (l.name   || '').toLowerCase().includes(q) ||
      (l.email  || '').toLowerCase().includes(q) ||
      (l.phone  || '').toLowerCase().includes(q) ||
      (l.propertyTitle || '').toLowerCase().includes(q)
    );
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  const handleStatusChange = async (newStatus) => {
    if (!selectedLead || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await updateLeadStatus(selectedLead.id, newStatus);
      const updated = { ...selectedLead, status: newStatus };
      setSelectedLead(updated);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l));
    } catch { /* silent */ }
    finally { setUpdatingStatus(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-neutral-400 dark:text-slate-500">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm">Chargement des leads…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            <RefreshCw size={13} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 h-[calc(100vh-4rem)] flex flex-col gap-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">Mes Leads</h1>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
            {leads.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="p-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-neutral-500 dark:text-slate-400 hover:text-primary hover:border-primary/40 transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={15} />
          </button>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setSelectedLead(null); }}
            style={{ fontSize: '16px' }}
            className="text-sm border border-neutral-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 px-3 py-2 text-neutral-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Tous les statuts</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {STATUSES.map(s => {
          const cfg      = STATUS_CONFIG[s];
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(isActive ? '' : s);
                setSelectedLead(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all
                ${isActive
                  ? `${cfg.color} ${cfg.border} border shadow-sm`
                  : 'bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:border-neutral-300 dark:hover:border-slate-600'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                ${isActive ? 'bg-white/60' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-slate-400'}`}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-hidden min-h-0">

        {/* Left panel: lead list */}
        <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden min-h-0">
          <div className="relative shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un lead…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ fontSize: '16px' }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-neutral-900 dark:text-slate-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-400 dark:text-slate-500 gap-2">
                <User size={32} className="opacity-30" />
                <p className="text-sm font-medium">Aucun lead trouvé</p>
                {(statusFilter || searchQ) && (
                  <button
                    onClick={() => { setStatusFilter(''); setSearchQ(''); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              filtered.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedLead?.id === lead.id}
                  onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right panel: detail */}
        <div className="lg:col-span-3 overflow-hidden min-h-0 flex flex-col">
          {selectedLead === null ? (
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-neutral-400 dark:text-slate-500 p-10 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquare size={28} className="opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-neutral-600 dark:text-slate-400 text-base">Sélectionnez un lead</p>
                <p className="text-sm text-neutral-400 dark:text-slate-500 mt-1">
                  Cliquez sur un contact à gauche pour voir ses détails
                </p>
              </div>
            </div>
          ) : (
            <LeadDetail
              lead={selectedLead}
              onStatusChange={handleStatusChange}
              updatingStatus={updatingStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}
