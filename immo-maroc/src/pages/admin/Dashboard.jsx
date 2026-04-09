import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import {
  getStatsOverview,
  getStatsByMonth,
  getTopAgents,
} from '../../api/stats';
import { getAllSellRequests } from '../../api/sellRequests';
import { getAllLeads } from '../../api/leads';
import { getImageUrl, getAvatarUrl, getExpiredListings } from '../../api/properties';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Building2,
  Users,
  TrendingUp,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const FRENCH_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function monthLabel(monthNumber) {
  const idx = parseInt(monthNumber, 10) - 1;
  return FRENCH_MONTHS[idx] ?? String(monthNumber);
}

function formatPrice(price, currency = 'MAD') {
  if (!price && price !== 0) return '—';
  return Number(price).toLocaleString('fr-MA') + ' ' + currency;
}

function fmtDate(str) {
  if (!str) return '—';
  return String(str).slice(0, 10);
}

/* ─── Status badge ───────────────────────────────────────────────────────── */

const STATUS_STYLES = {
  NOUVEAU:     'bg-blue-50   text-blue-600   ring-blue-200',
  nouveau:     'bg-blue-50   text-blue-600   ring-blue-200',
  DISPONIBLE:  'bg-green-50  text-green-600  ring-green-200',
  ACTIVE:      'bg-green-50  text-green-600  ring-green-200',
  active:      'bg-green-50  text-green-600  ring-green-200',
  VENDU:       'bg-purple-50 text-purple-600 ring-purple-200',
  CLOSED_WON:  'bg-purple-50 text-purple-600 ring-purple-200',
  CONTACTED:   'bg-orange-50 text-orange-600 ring-orange-200',
  en_cours:    'bg-orange-50 text-orange-600 ring-orange-200',
  EN_COURS:    'bg-orange-50 text-orange-600 ring-orange-200',
  QUALIFIED:   'bg-yellow-50 text-yellow-600 ring-yellow-200',
  CLOSED_LOST: 'bg-red-50    text-red-600    ring-red-200',
  INACTIVE:    'bg-red-50    text-red-600    ring-red-200',
  rejete:      'bg-red-50    text-red-600    ring-red-200',
  REJETE:      'bg-red-50    text-red-600    ring-red-200',
  LOUE:        'bg-teal-50   text-teal-600   ring-teal-200',
  traite:      'bg-green-50  text-green-600  ring-green-200',
  TRAITE:      'bg-green-50  text-green-600  ring-green-200',
};

const DOT_COLORS = {
  NOUVEAU:     'bg-blue-500',
  nouveau:     'bg-blue-500',
  DISPONIBLE:  'bg-green-500',
  ACTIVE:      'bg-green-500',
  active:      'bg-green-500',
  VENDU:       'bg-purple-500',
  CLOSED_WON:  'bg-purple-500',
  CONTACTED:   'bg-orange-500',
  en_cours:    'bg-orange-500',
  EN_COURS:    'bg-orange-500',
  QUALIFIED:   'bg-yellow-500',
  CLOSED_LOST: 'bg-red-500',
  INACTIVE:    'bg-red-500',
  rejete:      'bg-red-500',
  REJETE:      'bg-red-500',
  LOUE:        'bg-teal-500',
  traite:      'bg-green-500',
  TRAITE:      'bg-green-500',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-50 text-gray-600 ring-gray-200';
  const dot   = DOT_COLORS[status]   || 'bg-gray-400';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {status}
    </span>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, sub, trend }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      </div>
      {sub && (
        <p className="text-xs text-gray-400 border-t border-gray-50 pt-3">{sub}</p>
      )}
    </div>
  );
}

/* ─── Star rating ────────────────────────────────────────────────────────── */

function StarRating({ rating }) {
  const full = Math.floor(rating || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= full ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      {rating ? (
        <span className="text-xs text-gray-500 ml-1">{Number(rating).toFixed(1)}</span>
      ) : null}
    </div>
  );
}

/* ─── Custom chart tooltip ───────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-sky-600 font-bold">{payload[0].value} annonces</p>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useApp();

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [overview, setOverview]             = useState(null);
  const [monthly, setMonthly]               = useState([]);
  const [topAgents, setTopAgents]           = useState([]);
  const [recentLeads, setRecentLeads]       = useState([]);
  const [recentSellRequests, setRecentSellRequests] = useState([]);
  const [expiredListings, setExpiredListings] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, moRes, agentsRes, leadsRes, sellsRes, expiredRes] = await Promise.allSettled([
        getStatsOverview(),
        getStatsByMonth(),
        getTopAgents(),
        getAllLeads(),
        getAllSellRequests(),
        getExpiredListings(),
      ]);

      // Overview is critical — only hard-fail if it's missing
      if (ovRes.status === 'fulfilled') {
        setOverview(ovRes.value);
      } else {
        setError(ovRes.reason?.message || 'Erreur lors du chargement des données.');
      }

      if (moRes.status === 'fulfilled') {
        const mo = moRes.value;
        const moArray = Array.isArray(mo) ? mo : (mo?.content ?? []);
        setMonthly(
          moArray.map((item) => ({
            name:  monthLabel(item.month ?? item.monthNumber ?? item.period),
            count: item.count ?? item.total ?? item.value ?? 0,
          }))
        );
      }

      if (agentsRes.status === 'fulfilled') {
        const agents = agentsRes.value;
        setTopAgents(Array.isArray(agents) ? agents : (agents?.content ?? []));
      }

      if (leadsRes.status === 'fulfilled') {
        const leads = leadsRes.value;
        const leadsArr = Array.isArray(leads) ? leads : (leads?.content ?? []);
        setRecentLeads(leadsArr.slice(0, 5));
      }

      if (sellsRes.status === 'fulfilled') {
        const sells = sellsRes.value;
        const sellsArr = Array.isArray(sells) ? sells : (sells?.content ?? []);
        setRecentSellRequests(sellsArr.slice(0, 5));
      }

      if (expiredRes.status === 'fulfilled') {
        const expired = expiredRes.value;
        setExpiredListings(Array.isArray(expired) ? expired : (expired?.content ?? []));
      }
    } catch (err) {
      setError(err?.message || 'Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useAutoRefresh(fetchData);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-sm text-gray-400 font-medium">Chargement du tableau de bord…</p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="m-6">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Une erreur est survenue</p>
            <p className="text-xs mt-1 text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      icon:      Building2,
      iconBg:    'bg-blue-50',
      iconColor: 'text-blue-600',
      label:     'Annonces actives',
      value:     overview?.activeListings,
      sub:       overview?.newListingsThisMonth != null
                   ? `+${overview.newListingsThisMonth} ce mois`
                   : undefined,
    },
    {
      icon:      Users,
      iconBg:    'bg-purple-50',
      iconColor: 'text-purple-600',
      label:     'Agents actifs',
      value:     overview?.activeAgents,
      sub:       overview?.totalAgents != null
                   ? `${overview.totalAgents} total`
                   : undefined,
    },
    {
      icon:      TrendingUp,
      iconBg:    'bg-green-50',
      iconColor: 'text-green-600',
      label:     'Vendus & Loués',
      value:     ((overview?.totalSold || 0) + (overview?.totalRented || 0)),
      sub:       `${overview?.totalSold ?? 0} vendus · ${overview?.totalRented ?? 0} loués`,
    },
    {
      icon:      Eye,
      iconBg:    'bg-orange-50',
      iconColor: 'text-orange-600',
      label:     'Vues totales',
      value:     overview?.totalViews?.toLocaleString('fr-MA'),
      sub:       'Toutes annonces',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-full p-6 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-gray-400 mt-1">
            Bienvenue, <span className="font-medium text-gray-600">{user?.name}</span> — vue d'ensemble de votre plateforme
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-white border border-neutral-100 rounded-xl px-3 py-2 shadow-sm">
          <Clock size={13} />
          <span>Mis à jour maintenant</span>
        </div>
      </div>

      {/* ── ROW 1 — KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Expired listings alert ── */}
      {expiredListings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 text-sm">
              {expiredListings.length} annonce{expiredListings.length > 1 ? 's' : ''} expirée{expiredListings.length > 1 ? 's' : ''} — action requise
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Ces annonces sont marquées comme <strong>Vendu</strong> ou <strong>Loué</strong> depuis plus de 30 jours.
              Pensez à les supprimer pour garder la plateforme à jour.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {expiredListings.slice(0, 4).map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'VENDU' ? 'bg-red-500' : 'bg-purple-500'}`} />
                  {p.title?.slice(0, 28)}{p.title?.length > 28 ? '…' : ''} · {p.city}
                </span>
              ))}
              {expiredListings.length > 4 && (
                <span className="text-xs text-amber-500 self-center">+{expiredListings.length - 4} de plus</span>
              )}
            </div>
          </div>
          <Link
            to="/admin/annonces"
            className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
          >
            Voir <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* ── ROW 2 — Chart + Recent Leads ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Évolution des annonces</h2>
              <p className="text-xs text-gray-400 mt-0.5">Nombre d'annonces publiées par mois</p>
            </div>
          </div>

          {monthly.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0EA5E9"
                  strokeWidth={2.5}
                  fill="url(#colorCount)"
                  dot={{ r: 3, fill: '#0EA5E9', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Leads récents</h2>
              <p className="text-xs text-gray-400 mt-0.5">5 derniers contacts</p>
            </div>
            <MessageSquare size={16} className="text-gray-300" />
          </div>

          {recentLeads.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
              Aucun lead
            </div>
          ) : (
            <ul className="space-y-4 flex-1">
              {recentLeads.map((lead, idx) => (
                <li key={lead.id ?? idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {(lead.name || lead.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-none">
                      {lead.name || lead.fullName || '—'}
                    </p>
                    {lead.propertyTitle && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.propertyTitle}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={lead.status || 'NOUVEAU'} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 flex-shrink-0 mt-0.5">{fmtDate(lead.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── ROW 3 — Top Agents + Sell Requests ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top agents */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Top agents</h2>
              <p className="text-xs text-gray-400 mt-0.5">Agents les plus performants</p>
            </div>
            <Users size={16} className="text-gray-300" />
          </div>

          {topAgents.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
              Aucun agent
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Agent</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Agence</th>
                    <th className="text-center text-xs text-gray-400 font-medium pb-3">Ann.</th>
                    <th className="text-center text-xs text-gray-400 font-medium pb-3">Ventes</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topAgents.map((agent, idx) => (
                    <tr key={agent.id ?? idx} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              agent.avatar
                                ? getAvatarUrl(agent.avatar)
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name || 'A')}&background=e0f2fe&color=0284c7&size=32`
                            }
                            alt={agent.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-xs truncate leading-none">
                              {agent.name || '—'}
                            </p>
                            {agent.city && (
                              <p className="text-gray-400 text-[10px] mt-0.5">{agent.city}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-gray-500 truncate max-w-[100px]">
                        {agent.agency || agent.agencyName || '—'}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs font-semibold text-gray-800">
                          {agent.listingCount ?? agent.listings ?? agent.propertyCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs font-semibold text-emerald-600">
                          {agent.sold ?? agent.soldCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3">
                        <StarRating rating={agent.rating} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sell requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Demandes de vente</h2>
              <p className="text-xs text-gray-400 mt-0.5">5 dernières demandes</p>
            </div>
            <CheckCircle size={16} className="text-gray-300" />
          </div>

          {recentSellRequests.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
              Aucune demande
            </div>
          ) : (
            <ul className="space-y-3 flex-1">
              {recentSellRequests.map((req, idx) => (
                <li
                  key={req.id ?? idx}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:bg-gray-50/70 hover:border-gray-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {(req.fullName || req.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate leading-none">
                      {req.fullName || req.name || '—'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 flex-wrap">
                      {req.city && <span>{req.city}</span>}
                      {req.city && req.type && <span className="text-gray-200">·</span>}
                      {req.type && <span>{req.type}</span>}
                      {req.price && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="font-medium text-gray-600">{formatPrice(req.price, t('common.currency'))}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <StatusBadge status={req.status || 'NOUVEAU'} />
                    <p className="text-[10px] text-gray-300">{fmtDate(req.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}
