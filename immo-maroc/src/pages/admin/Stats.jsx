import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import {
  getStatsOverview, getStatsByMonth, getStatsByCity, getStatsByType, getTopAgents,
} from '../../api/stats';
import { getAvatarUrl } from '../../api/properties';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Building2, Users, Eye, TrendingUp, Loader2, AlertCircle,
  MapPin, Star, RefreshCw,
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────────────────── */

const FRENCH_MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const TYPE_COLORS   = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899'];

const TYPE_LABELS = {
  APPARTEMENT: 'Appartement', VILLA: 'Villa', BUREAU: 'Bureau',
  COMMERCE: 'Commerce', TERRAIN: 'Terrain', RIAD: 'Riad',
  FERME: 'Ferme', DUPLEX: 'Duplex',
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function monthLabel(m) {
  const n = parseInt(m, 10);
  return (n >= 1 && n <= 12) ? FRENCH_MONTHS[n - 1] : String(m);
}
function fmt(n) { return n == null ? '—' : Number(n).toLocaleString('fr-MA'); }

/* ─── Custom tooltip ─────────────────────────────────────────────────────── */

function ChartTooltip({ active, payload, label, unit = '' }) {
  const { isDark } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-2xl shadow-xl px-4 py-3 text-sm min-w-[120px] border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-neutral-100 text-neutral-900'}`}>
      <p className={`text-xs mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {fmt(p.value)}{unit && ` ${unit}`}
        </p>
      ))}
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */

function KpiCard({ icon: Icon, label, value, sub, gradient, ring }) {
  return (
    <div className={`relative rounded-3xl p-6 overflow-hidden ${gradient} shadow-lg`}>
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-white/10" />
      <div className={`relative z-10 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 ring-1 ${ring} mb-4`}>
        <Icon size={22} className="text-white" />
      </div>
      <p className="relative z-10 text-4xl font-extrabold text-white leading-none tracking-tight">{value}</p>
      <p className="relative z-10 text-white/80 text-sm font-semibold mt-1">{label}</p>
      {sub && <p className="relative z-10 text-white/50 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Custom city bar (HTML, no recharts) ────────────────────────────────── */

function CityBar({ city, count, max, rank }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
  ];
  const grad = gradients[rank % gradients.length];
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-28 text-right text-sm font-semibold text-neutral-600 dark:text-slate-400 shrink-0 truncate">{city}</div>
      <div className="flex-1 bg-neutral-100 dark:bg-slate-700 rounded-full h-9 overflow-hidden relative">
        <div
          className={`h-full bg-gradient-to-r ${grad} rounded-full flex items-center justify-end pr-3 transition-all duration-700`}
          style={{ width: `${Math.max(pct, 6)}%` }}
        >
          <span className="text-white text-xs font-bold drop-shadow-sm">{count}</span>
        </div>
      </div>
      <div className="w-8 text-xs text-neutral-400 dark:text-slate-500 shrink-0 font-medium">{Math.round(pct)}%</div>
    </div>
  );
}

/* ─── Custom donut center label ──────────────────────────────────────────── */

function DonutCenter({ cx, cy, total, isDark }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-8" fontSize="22" fontWeight="800" fill={isDark ? '#f1f5f9' : '#1e293b'}>{total}</tspan>
      <tspan x={cx} dy="22" fontSize="11" fill="#94a3b8" fontWeight="500">biens</tspan>
    </text>
  );
}

/* ─── Rank medal ─────────────────────────────────────────────────────────── */

function RankBadge({ rank }) {
  if (rank === 0) return <span className="text-lg">🥇</span>;
  if (rank === 1) return <span className="text-lg">🥈</span>;
  if (rank === 2) return <span className="text-lg">🥉</span>;
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-slate-700 text-xs font-bold text-neutral-500 dark:text-slate-400">
      {rank + 1}
    </span>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

export default function AdminStats() {
  const { i18n } = useTranslation();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [overview,   setOverview]   = useState(null);
  const [monthly,    setMonthly]    = useState([]);
  const [byCity,     setByCity]     = useState([]);
  const [byType,     setByType]     = useState([]);
  const [topAgents,  setTopAgents]  = useState([]);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([getStatsOverview(), getStatsByMonth(), getStatsByCity(), getStatsByType(), getTopAgents()])
      .then(([ov, mon, city, type, agents]) => {
        setOverview(ov || {});
        setMonthly(Array.isArray(mon) ? mon : []);
        setByCity(Array.isArray(city) ? city : []);
        setByType(Array.isArray(type) ? type : []);
        setTopAgents(Array.isArray(agents) ? agents : []);
      })
      .catch(err => setError(err.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useAutoRefresh(fetchStats);

  const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
  const tickFill   = isDark ? '#64748b' : '#94a3b8';

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-neutral-400 dark:text-slate-500">
      <Loader2 size={32} className="animate-spin text-primary" />
      <p className="text-sm">Chargement des statistiques…</p>
    </div>
  );

  if (error) return (
    <div className="m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex items-center gap-4">
      <AlertCircle size={22} className="text-red-500 shrink-0" />
      <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
      <button onClick={fetchStats} className="ml-auto flex items-center gap-1 text-xs text-red-600 dark:text-red-400 underline">
        <RefreshCw size={12} /> Réessayer
      </button>
    </div>
  );

  const monthlyData = monthly.map(m => ({
    name: monthLabel(m.month),
    annonces: Number(m.count ?? m.total ?? 0),
  }));

  const cityData = [...byCity]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 10);
  const cityMax = cityData.reduce((m, c) => Math.max(m, c.count ?? 0), 0);

  const typeData = byType.map(t => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: Number(t.count ?? 0),
  }));
  const typeTotal = typeData.reduce((s, t) => s + t.value, 0);

  return (
    <div className="p-4 sm:p-6 bg-neutral-50 dark:bg-slate-950 min-h-full space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Statistiques</h1>
          <p className="text-neutral-500 dark:text-slate-400 text-sm mt-0.5">Données en temps réel</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Building2}  label="Total annonces"   value={fmt(overview?.totalListings)}  sub={`${fmt(overview?.activeListings)} actives`} gradient="bg-gradient-to-br from-violet-500 to-purple-700" ring="ring-white/20" />
        <KpiCard icon={TrendingUp} label="Vendus & Loués"   value={fmt((overview?.totalSold ?? 0) + (overview?.totalRented ?? 0))} sub={`${fmt(overview?.totalSold)} vendus · ${fmt(overview?.totalRented)} loués`} gradient="bg-gradient-to-br from-emerald-500 to-teal-700" ring="ring-white/20" />
        <KpiCard icon={Users}      label="Agents actifs"    value={fmt(overview?.activeAgents ?? overview?.totalAgents)} sub={`${fmt(overview?.totalAgents)} total`} gradient="bg-gradient-to-br from-blue-500 to-indigo-700" ring="ring-white/20" />
        <KpiCard icon={Eye}        label="Vues totales"     value={fmt(overview?.totalViews)}     sub="Toutes annonces" gradient="bg-gradient-to-br from-orange-500 to-rose-600" ring="ring-white/20" />
      </div>

      {/* ── Monthly trend ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-neutral-900 dark:text-white text-lg">Évolution mensuelle</h2>
            <p className="text-neutral-400 dark:text-slate-500 text-sm mt-0.5">Nouvelles annonces publiées par mois</p>
          </div>
          {monthlyData.length > 0 && (
            <div className="text-right">
              <p className="text-2xl font-extrabold text-violet-600">
                {monthlyData.reduce((s, m) => s + m.annonces, 0)}
              </p>
              <p className="text-xs text-neutral-400 dark:text-slate-500">total annonces</p>
            </div>
          )}
        </div>
        {monthlyData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-neutral-300 dark:text-slate-600">
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="statGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="annonces" stroke="#8b5cf6" strokeWidth={3}
                fill="url(#statGrad)"
                dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }}
                activeDot={{ r: 7, fill: '#8b5cf6', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── City + Type ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* City — custom HTML bars */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <MapPin size={18} className="text-violet-500" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">Annonces par ville</h2>
              <p className="text-neutral-400 dark:text-slate-500 text-xs">Top {cityData.length} villes</p>
            </div>
          </div>
          {cityData.length === 0 ? (
            <p className="text-center text-neutral-300 dark:text-slate-600 py-12 text-sm">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {cityData.map((c, i) => (
                <CityBar key={c.city} city={c.city} count={Number(c.count ?? 0)} max={cityMax} rank={i} />
              ))}
            </div>
          )}
        </div>

        {/* Type — donut */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Building2 size={18} className="text-indigo-500" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 dark:text-white">Par type de bien</h2>
              <p className="text-neutral-400 dark:text-slate-500 text-xs">{typeTotal} annonces au total</p>
            </div>
          </div>
          {typeData.length === 0 ? (
            <p className="text-center text-neutral-300 dark:text-slate-600 py-12 text-sm">Aucune donnée</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={typeData} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={88}
                    paddingAngle={3} dataKey="value"
                    startAngle={90} endAngle={-270}
                  >
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} stroke={isDark ? '#0f172a' : '#fff'} strokeWidth={2} />
                    ))}
                    <DonutCenter cx={100} cy={100} total={typeTotal} isDark={isDark} />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                      fontSize: 13,
                      background: isDark ? '#1e293b' : '#fff',
                      color: isDark ? '#f1f5f9' : '#1e293b',
                    }}
                    formatter={(v, n) => [`${v} (${typeTotal > 0 ? Math.round((v / typeTotal) * 100) : 0}%)`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {typeData.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }}
                    />
                    <span className="text-sm text-neutral-700 dark:text-slate-300 font-medium flex-1 truncate">{t.name}</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white shrink-0">{t.value}</span>
                    <span className="text-xs text-neutral-400 dark:text-slate-500 shrink-0 w-9 text-right">
                      {typeTotal > 0 ? Math.round((t.value / typeTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Agents ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-neutral-900 dark:text-white text-lg">Top Agents</h2>
            <p className="text-neutral-400 dark:text-slate-500 text-sm mt-0.5">Classement par performance</p>
          </div>
          <Star size={18} className="text-amber-400" />
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-slate-800">
          {topAgents.length === 0 ? (
            <p className="text-center py-10 text-neutral-300 dark:text-slate-600 text-sm">Aucun agent disponible</p>
          ) : topAgents.map((agent, i) => {
            const maxListings = Math.max(...topAgents.map(a => a.listingCount ?? 0), 1);
            const pct = ((agent.listingCount ?? 0) / maxListings) * 100;
            return (
              <div key={agent.id ?? i} className="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 dark:hover:bg-slate-800/60 transition-colors">
                <RankBadge rank={i} />
                <img
                  src={getAvatarUrl(agent.avatar)}
                  alt={agent.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{agent.name}</p>
                  <p className="text-xs text-neutral-400 dark:text-slate-500 truncate">{agent.city || '—'}</p>
                  <div className="mt-1.5 h-1.5 bg-neutral-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-6 shrink-0 text-center">
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-white text-sm">{agent.listingCount ?? 0}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-slate-500">Ann.</p>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-600 text-sm">{agent.sold ?? 0}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-slate-500">Ventes</p>
                  </div>
                  <div>
                    <p className="font-bold text-amber-500 text-sm">
                      {agent.rating ? `★ ${agent.rating}` : '—'}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-slate-500">Note</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
