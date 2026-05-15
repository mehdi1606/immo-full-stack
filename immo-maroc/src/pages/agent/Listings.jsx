import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Pencil, Eye, Search,
  TrendingUp, Star, Building2, Calendar,
  ChevronDown, CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import {
  getPropertiesByAgent,
  updatePropertyStatus, toggleFeatured, getImageUrl,
} from '../../api/properties';
import { getMe } from '../../api/auth';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/* ─── Config ─────────────────────────────────────────────────────────────── */

const STATUS_CFG = {
  DISPONIBLE: { label: 'Disponible', dot: 'bg-emerald-400', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800' },
  VENDU:      { label: 'Vendu',      dot: 'bg-blue-400',    cls: 'bg-blue-50   text-blue-700   ring-1 ring-blue-200   dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800'   },
  LOUE:       { label: 'Loué',       dot: 'bg-purple-400',  cls: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-800' },
};

const BACKEND_STATUSES = ['DISPONIBLE', 'VENDU', 'LOUE'];

const PURPOSE_CFG = {
  VENTE:    { label: 'Vente',    cls: 'bg-sky-50   text-sky-600   dark:bg-sky-900/30 dark:text-sky-400'   },
  LOCATION: { label: 'Location', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(price, purpose, subPurpose, currency = 'MAD') {
  if (!price && price !== 0) return '—';
  let suffix = '';
  if (purpose === 'LOCATION') suffix = subPurpose === 'COURT_TERME' ? '/jour' : '/mois';
  return `${Number(price).toLocaleString('fr-MA')} ${currency}${suffix}`;
}

function infoLine(p) {
  return [p.city, p.area != null ? `${p.area} m²` : null, p.rooms != null ? `${p.rooms} ch.` : null]
    .filter(Boolean).join(' · ');
}

/* ─── StatusDropdown — portal-based, never clipped ──────────────────────── */

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: r.left });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const sc = STATUS_CFG[value] || {};

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all hover:opacity-80 ${sc.cls || 'bg-neutral-100 text-neutral-600'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot || 'bg-neutral-400'}`} />
        {sc.label || value}
        <ChevronDown size={10} className="opacity-60" />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-neutral-100 dark:border-slate-700 py-2 w-44"
          onMouseDown={e => e.stopPropagation()}
        >
          <p className="px-4 pb-1 text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest">
            Statut
          </p>
          {BACKEND_STATUSES.map(s => {
            const cfg = STATUS_CFG[s];
            const active = value === s;
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-slate-700/60 ${active ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-slate-400'}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg?.dot}`} />
                <span className="flex-1 text-left">{cfg?.label}</span>
                {active && <CheckCircle2 size={12} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function AgentListings() {
  const { user } = useApp();
  const { t, i18n } = useTranslation();

  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [q,             setQ]             = useState('');
  const [filterStatus,  setFilterStatus]  = useState('Tous');
  const [toast,         setToast]         = useState('');

  /* ── Fetch ───────────────────────────────────────────────────────────── */

  const fetchListings = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      let agentId = user.agentId;
      if (!agentId) { const me = await getMe(); agentId = me?.id; }
      if (!agentId) { setError('Profil agent introuvable.'); return; }
      const data = await getPropertiesByAgent(agentId);
      setListings(Array.isArray(data) ? data : (data?.content ?? []));
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement.');
    } finally { setLoading(false); }
  }, [user, i18n.language]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useAutoRefresh(fetchListings);

  /* ── Derived ─────────────────────────────────────────────────────────── */

  const filtered = listings
    .filter(l => filterStatus === 'Tous' || l.status === filterStatus)
    .filter(l => !q || l.title?.toLowerCase().includes(q.toLowerCase()) || l.city?.toLowerCase().includes(q.toLowerCase()));

  const totalViews    = listings.reduce((s, p) => s + (p.views || 0), 0);
  const featuredCount = listings.filter(p => p.featured).length;

  /* ── Actions ─────────────────────────────────────────────────────────── */

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleStatusChange = async (id, status) => {
    setListings(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    try { await updatePropertyStatus(id, status); } catch { fetchListings(); }
  };

  const handleToggleFeatured = async (id) => {
    setListings(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
    try {
      await toggleFeatured(id);
    } catch {
      setListings(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
    }
  };

  /* ── Guards ──────────────────────────────────────────────────────────── */

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (error)   return <ErrorMessage message={error} onRetry={fetchListings} />;

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Toast */}
      {toast && createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-neutral-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          {toast}
        </div>,
        document.body
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes annonces</h1>
          <p className="text-sm text-neutral-400 dark:text-slate-500 mt-0.5">
            {listings.length} annonce{listings.length !== 1 ? 's' : ''} publiée{listings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/agent/ajouter"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle size={16} />
          Nouvelle annonce
        </Link>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total annonces', value: listings.length,                    icon: Building2,  color: 'text-neutral-700 dark:text-slate-300', bg: 'bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800' },
          { label: 'Vues totales',   value: totalViews.toLocaleString('fr-MA'), icon: TrendingUp, color: 'text-primary',     bg: 'bg-primary/5 border border-primary/20 dark:border-primary/30' },
          { label: 'En vedette',     value: featuredCount,                       icon: Star,       color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl p-4 ${bg}`}>
            <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
              <Icon size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre ou ville…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ fontSize: '16px' }}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-900 dark:text-slate-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { value: 'Tous',       label: 'Tous'       },
            { value: 'DISPONIBLE', label: 'Disponible' },
            { value: 'VENDU',      label: 'Vendu'      },
            { value: 'LOUE',       label: 'Loué'       },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 h-9 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:bg-neutral-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 size={40} className="text-neutral-200 dark:text-slate-700 mb-3" />
            <p className="font-semibold text-neutral-500 dark:text-slate-400 text-sm">Aucune annonce trouvée</p>
            <p className="text-xs text-neutral-400 dark:text-slate-500 mt-1 mb-5">
              {q || filterStatus !== 'Tous' ? 'Modifiez vos filtres.' : 'Ajoutez votre première annonce.'}
            </p>
            {!q && filterStatus === 'Tous' && (
              <Link
                to="/agent/ajouter"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <PlusCircle size={14} /> Créer une annonce
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-slate-800">
                  {['Bien', 'Type', 'Statut', 'Premium', 'Vues', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest px-5 py-3.5 whitespace-nowrap first:pl-6 last:pr-6 bg-neutral-50/70 dark:bg-slate-800/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const pc     = PURPOSE_CFG[p.purpose];
                  const isLast = idx === filtered.length - 1;
                  return (
                    <tr key={p.id} className={`group hover:bg-neutral-50/60 dark:hover:bg-slate-800/60 transition-colors ${!isLast ? 'border-b border-neutral-100 dark:border-slate-800' : ''}`}>

                      {/* Bien */}
                      <td className="px-5 py-4 pl-6 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={getImageUrl(p.mainImageUrl)}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover border border-neutral-100 dark:border-slate-700"
                              loading="lazy"
                            />
                            {p.featured && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                                <Star size={9} className="text-white fill-white" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate max-w-[200px]">{p.title}</p>
                            <p className="text-xs text-neutral-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">{infoLine(p) || '—'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-primary">{formatPrice(p.price, p.purpose, p.subPurpose, t('common.currency'))}</span>
                              {pc && <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${pc.cls}`}>{pc.label}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-neutral-600 dark:text-slate-400 bg-neutral-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-medium">
                          {t(`common.type.${p.type}`, p.type)}
                        </span>
                      </td>

                      {/* Statut — custom portal dropdown */}
                      <td className="px-5 py-4">
                        <StatusDropdown
                          value={p.status}
                          onChange={status => handleStatusChange(p.id, status)}
                        />
                      </td>

                      {/* Premium */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleFeatured(p.id)}
                          title={p.featured ? 'Retirer de la sélection premium' : 'Mettre en sélection premium'}
                          className={`group/star inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            p.featured
                              ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                              : 'bg-neutral-100 dark:bg-slate-800 text-neutral-400 dark:text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 hover:ring-1 hover:ring-amber-200 dark:hover:ring-amber-800'
                          }`}
                        >
                          <Star
                            size={12}
                            className={p.featured ? 'fill-amber-500 text-amber-500' : 'group-hover/star:text-amber-400'}
                          />
                          {p.featured ? 'Premium' : 'Standard'}
                        </button>
                      </td>

                      {/* Vues */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-slate-400">
                          <Eye size={12} className="text-neutral-300 dark:text-slate-600" />
                          {(p.views || 0).toLocaleString('fr-MA')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-slate-500">
                          <Calendar size={11} className="text-neutral-300 dark:text-slate-600" />
                          {formatDate(p.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 pr-6">
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Link to={`/propriete/${p.id}`} className="p-2 rounded-lg text-neutral-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" title="Voir">
                            <Eye size={15} />
                          </Link>
                          <Link to={`/agent/modifier/${p.id}`} className="p-2 rounded-lg text-neutral-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Modifier">
                            <Pencil size={15} />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-neutral-50 dark:border-slate-800">
            <p className="text-xs text-neutral-400 dark:text-slate-500">
              {filtered.length} sur {listings.length} annonce{listings.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
