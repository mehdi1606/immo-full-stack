import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { getPropertiesByAgent, getImageUrl } from '../../api/properties';
import { getMyLeads } from '../../api/leads';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Building2, Eye, TrendingUp, MessageSquare, Plus,
  ChevronRight, Clock, Loader2, Home, Zap, BarChart2,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────────────── */
function formatPrice(price, purpose, subPurpose, currency = 'MAD') {
  if (!price) return '—';
  let suffix = '';
  if (purpose === 'LOCATION') suffix = subPurpose === 'COURT_TERME' ? '/j' : '/m';
  return `${price.toLocaleString('fr-MA')} ${currency}${suffix}`;
}

function StatusBadge({ status }) {
  const map = {
    DISPONIBLE: { cls: 'bg-emerald-100 text-emerald-700', label: 'Disponible' },
    VENDU:      { cls: 'bg-violet-100 text-violet-700',   label: 'Vendu' },
    LOUE:       { cls: 'bg-teal-100 text-teal-700',       label: 'Loué' },
  };
  const { cls, label } = map[status] || { cls: 'bg-neutral-100 text-neutral-600', label: status };
  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${cls}`}>{label}</span>
  );
}

const LEAD_COLORS = {
  NOUVEAU:     '#3b82f6',
  CONTACTED:   '#f97316',
  QUALIFIED:   '#eab308',
  CLOSED_WON:  '#22c55e',
  CLOSED_LOST: '#ef4444',
};
const LEAD_LABEL = {
  NOUVEAU:     'Nouveau',
  CONTACTED:   'Contacté',
  QUALIFIED:   'Qualifié',
  CLOSED_WON:  'Conclu',
  CLOSED_LOST: 'Perdu',
};
const STATUS_META = {
  DISPONIBLE: { label: 'Disponibles', gradient: 'from-emerald-400 to-teal-500' },
  VENDU:      { label: 'Vendus',      gradient: 'from-violet-400 to-purple-600' },
  LOUE:       { label: 'Loués',       gradient: 'from-teal-400 to-cyan-500' },
};

/* ─── Data builders ─────────────────────────────────────────────── */
function buildChartData(properties) {
  const counts = {};
  properties.forEach(p => {
    if (!p.createdAt) return;
    const key = p.createdAt.slice(0, 7);
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      annonces: count,
    }));
}

function buildLeadPie(leads) {
  const counts = {};
  leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
  return Object.entries(counts).map(([status, value]) => ({
    name: LEAD_LABEL[status] || status,
    value,
    color: LEAD_COLORS[status] || '#94a3b8',
  }));
}

function buildStatusBars(properties) {
  const counts = { DISPONIBLE: 0, VENDU: 0, LOUE: 0 };
  properties.forEach(p => { if (counts[p.status] !== undefined) counts[p.status]++; });
  return ['DISPONIBLE', 'VENDU', 'LOUE'].map(k => ({ key: k, ...STATUS_META[k], count: counts[k] }));
}

/* ─── Custom tooltip ─────────────────────────────────────────────── */
function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,31,34,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 600 }}>
        {payload[0].value} annonce{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function GradientKpiCard({ label, value, sub, icon: Icon, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-lg`}>
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
            <Icon size={18} />
          </div>
          <span className="text-white/70 text-xs font-medium">{sub}</span>
        </div>
        <p className="text-3xl font-bold leading-none mb-1">{value}</p>
        <p className="text-white/80 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, colorCls }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95 ${colorCls}`}>
      <Icon size={15} />{label}
    </Link>
  );
}

function PropBar({ label, count, total, gradient }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-right text-sm font-medium text-neutral-600 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 shrink-0 flex items-center gap-1">
        <span className="text-sm font-bold text-neutral-800">{count}</span>
        <span className="text-xs text-neutral-400">({pct}%)</span>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────── */
export default function AgentDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useApp();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [properties, setProperties] = useState([]);
  const [leads, setLeads]           = useState([]);

  const fetchData = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    const agentId = user?.agentId ?? user?.id;
    Promise.allSettled([getPropertiesByAgent(agentId), getMyLeads()])
      .then(([propsRes, leadsRes]) => {
        let bothFailed = true;
        if (propsRes.status === 'fulfilled') {
          bothFailed = false;
          const v = propsRes.value;
          setProperties(Array.isArray(v) ? v : (v?.content ?? []));
        }
        if (leadsRes.status === 'fulfilled') {
          bothFailed = false;
          const v = leadsRes.value;
          setLeads(Array.isArray(v) ? v : (v?.content ?? []));
        }
        if (bothFailed) setError('Impossible de charger les données du tableau de bord.');
      })
      .finally(() => setLoading(false));
  }, [user, i18n.language]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useAutoRefresh(fetchData);

  /* ── Derived ── */
  const totalListings = properties.length;
  const totalViews    = properties.reduce((s, p) => s + (p.views || 0), 0);
  const soldCount     = properties.filter(p => p.status === 'VENDU').length;
  const activeCount   = properties.filter(p => p.status === 'DISPONIBLE').length;
  const newLeads      = leads.filter(l => l.status === 'NOUVEAU').length;
  const featuredCount = properties.filter(p => p.featured).length;

  const chartData  = buildChartData(properties);
  const leadPie    = buildLeadPie(leads);
  const statusBars = buildStatusBars(properties);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayStr = today.charAt(0).toUpperCase() + today.slice(1);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-neutral-400">
      <Loader2 size={32} className="animate-spin text-primary" />
      <p className="text-sm">Chargement du tableau de bord…</p>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">{error}</div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-full space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-neutral-900">
            Bonjour, {user?.name} 👋
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">Voici un aperçu de votre activité immobilière</p>
          <p className="text-neutral-400 text-xs mt-1.5 flex items-center gap-1.5">
            <Clock size={12} />{todayStr}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <QuickAction to="/agent/ajouter"  icon={Plus}          label="Nouvelle annonce" colorCls="bg-primary text-white" />
          <QuickAction to="/agent/leads"    icon={MessageSquare} label="Mes leads"         colorCls="bg-white text-neutral-700 border border-neutral-200" />
          <QuickAction to="/agent/annonces" icon={Home}          label="Annonces"          colorCls="bg-white text-neutral-700 border border-neutral-200" />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientKpiCard label="Mes annonces" value={totalListings}
          sub={`${activeCount} active${activeCount !== 1 ? 's' : ''}`}
          icon={Building2} gradient="from-violet-500 to-purple-700" />
        <GradientKpiCard label="Vues totales" value={totalViews.toLocaleString('fr-MA')}
          sub="Toutes annonces"
          icon={Eye} gradient="from-sky-500 to-blue-700" />
        <GradientKpiCard label="Leads" value={leads.length}
          sub={`${newLeads} nouveau${newLeads !== 1 ? 'x' : ''}`}
          icon={MessageSquare} gradient="from-emerald-500 to-teal-700" />
        <GradientKpiCard label="Vendus" value={soldCount}
          sub={`${featuredCount} en vedette`}
          icon={TrendingUp} gradient="from-orange-500 to-rose-600" />
      </div>

      {/* ── Charts row — always 3 cols ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Publications par mois — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-semibold text-neutral-900">Publications mensuelles</h2>
              <p className="text-neutral-400 text-xs mt-0.5">Nouvelles annonces publiées par mois</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <Zap size={15} className="text-violet-500" />
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-neutral-300">
              <BarChart2 size={36} className="opacity-40" />
              <p className="text-sm text-neutral-400">Aucune donnée à afficher pour l'instant</p>
              <Link to="/agent/ajouter" className="text-primary text-sm font-semibold hover:underline">
                Ajouter votre première annonce
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="agentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<AreaTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone" dataKey="annonces" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#agentGrad)"
                  dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right column: lead donut + status bars stacked */}
        <div className="flex flex-col gap-4">

          {/* Lead status donut */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 flex-1">
            <h2 className="font-semibold text-neutral-900 mb-0.5">Statut des leads</h2>
            <p className="text-neutral-400 text-xs mb-3">Répartition par statut</p>

            {leadPie.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 gap-2 text-neutral-300">
                <MessageSquare size={28} className="opacity-40" />
                <p className="text-xs text-neutral-400">Aucun lead reçu</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div style={{ width: 110, height: 110, flexShrink: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadPie} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                        dataKey="value" strokeWidth={2} stroke="#fff" startAngle={90} endAngle={-270}>
                        {leadPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{leads.length}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>leads</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {leadPie.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-neutral-600 flex-1 truncate">{d.name}</span>
                      <span className="text-xs font-bold text-neutral-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property status bars */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 flex-1">
            <h2 className="font-semibold text-neutral-900 mb-0.5">État des biens</h2>
            <p className="text-neutral-400 text-xs mb-4">
              {totalListings} bien{totalListings !== 1 ? 's' : ''} au total
            </p>

            {totalListings === 0 ? (
              <div className="flex flex-col items-center justify-center h-20 gap-2 text-neutral-300">
                <Building2 size={28} className="opacity-40" />
                <p className="text-xs text-neutral-400">Aucun bien enregistré</p>
              </div>
            ) : (
              <div className="space-y-3">
                {statusBars.map(d => (
                  <PropBar key={d.key} label={d.label} count={d.count} total={totalListings} gradient={d.gradient} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row: recent listings + recent leads ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent listings */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900">Mes annonces récentes</h2>
            <Link to="/agent/annonces" className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center">
                <Home size={28} className="opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Aucune annonce pour le moment</p>
                <p className="text-xs text-neutral-300 mt-1">Commencez par ajouter votre premier bien</p>
              </div>
              <Link to="/agent/ajouter" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90">
                <Plus size={14} /> Ajouter une annonce
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {properties.slice(0, 6).map(p => (
                <div key={p.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-neutral-50 -mx-2 px-2 rounded-xl transition-colors group">
                  <img
                    src={getImageUrl(p.mainImageUrl || p.images?.[0])}
                    alt={p.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 bg-neutral-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 text-sm truncate">{p.title}</p>
                    <p className="text-neutral-400 text-xs truncate">{p.city}</p>
                  </div>
                  <div className="shrink-0 hidden sm:block">
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="shrink-0 text-sm font-semibold text-neutral-700 hidden md:block min-w-[90px] text-right">
                    {formatPrice(p.price, p.purpose, p.subPurpose, t('common.currency'))}
                  </div>
                  <div className="shrink-0 hidden lg:flex items-center gap-1 text-xs text-neutral-400 min-w-[50px]">
                    <Eye size={12} />{(p.views || 0).toLocaleString()}
                  </div>
                  <Link to={`/agent/annonces/${p.id}/modifier`}
                    className="shrink-0 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Modifier
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900">Leads récents</h2>
            <Link to="/agent/leads" className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
              <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center">
                <MessageSquare size={28} className="opacity-30" />
              </div>
              <p className="text-sm font-medium">Aucun lead pour le moment</p>
              <p className="text-xs text-neutral-300">Les contacts apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.slice(0, 6).map(lead => (
                <div key={lead.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors -mx-1">
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: LEAD_COLORS[lead.status] || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 text-sm truncate">{lead.name}</p>
                    <p className="text-neutral-400 text-xs truncate">{lead.propertyTitle || '—'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: (LEAD_COLORS[lead.status] || '#94a3b8') + '22',
                          color: LEAD_COLORS[lead.status] || '#94a3b8',
                        }}>
                        {LEAD_LABEL[lead.status] || lead.status}
                      </span>
                      {lead.createdAt && (
                        <span className="text-[10px] text-neutral-300 flex items-center gap-0.5">
                          <Clock size={9} />{lead.createdAt.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
