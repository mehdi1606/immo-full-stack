import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  MessageSquare,
  Inbox,
  Mail,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../../api/properties';
import NotificationBell from '../../components/NotificationBell';
import ThemeToggle from '../../components/common/ThemeToggle.jsx';
import { useTheme } from '../../hooks/useTheme.jsx';

const NAV_SECTIONS = [
  {
    label: 'GÉNÉRAL',
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, path: '/admin',           end: true  },
      { label: 'Annonces',     icon: Building2,        path: '/admin/annonces'             },
    ],
  },
  {
    label: 'GESTION',
    items: [
      { label: 'Agents',       icon: Users,            path: '/admin/agents'               },
      { label: 'Leads',        icon: Inbox,            path: '/admin/leads'                },
      { label: 'Demandes',     icon: MessageSquare,    path: '/admin/demandes'             },
      { label: 'Messages',     icon: Mail,             path: '/admin/messages'             },
      { label: 'Statistiques', icon: BarChart3,        path: '/admin/stats'                },
    ],
  },
];

function getPageName(pathname) {
  const map = {
    '/admin':           'Dashboard',
    '/admin/annonces':  'Annonces',
    '/admin/agents':    'Agents',
    '/admin/leads':     'Leads',
    '/admin/demandes':  'Demandes',
    '/admin/messages':  'Messages de contact',
    '/admin/stats':     'Statistiques',
  };
  return map[pathname] || 'Admin';
}

/* ─── Sidebar inner content ─────────────────────────────────────────────── */
function SidebarContent({ onClose }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const linkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
      isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300',
    ].join(' ');

  const linkStyle = ({ isActive }) => ({
    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
  });

  return (
    <div className="flex flex-col h-full" style={{ background: '#0F1F22' }}>
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-white text-xl font-bold tracking-tight">IMMO</span>
            <span className="text-accent text-xl font-bold tracking-tight"> 21</span>
          </div>
          <p className="text-gray-600 text-[10px] tracking-widest uppercase mt-0.5">Admin CPanel</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-gray-600 text-[10px] font-semibold tracking-widest uppercase px-3 mb-2">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;

                if (item.external) {
                  return (
                    <li key={item.path}>
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-300 transition-all duration-200 group"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors flex-shrink-0">
                          <Icon size={15} />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight size={13} className="opacity-40" />
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      className={linkClass}
                      style={linkStyle}
                      onClick={onClose}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={[
                              'flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0',
                              isActive
                                ? 'bg-white/15'
                                : 'bg-white/5 group-hover:bg-white/10',
                            ].join(' ')}
                          >
                            <Icon size={15} />
                          </span>
                          <span className="flex-1">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User block ── */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 mb-2">
          <div className="relative flex-shrink-0">
            <img
              src={
                user?.avatar
                  ? getAvatarUrl(user.avatar)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=1e3a3f&color=ffffff&size=40`
              }
              alt={user?.name || 'Admin'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#0F1F22] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-none">
              {user?.name || 'Administrateur'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Shield size={10} className="text-primary flex-shrink-0" />
              <span className="text-primary text-[10px] font-medium uppercase tracking-wide">
                {user?.role || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Main layout ────────────────────────────────────────────────────────── */
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useApp();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const pageName =
    typeof window !== 'undefined'
      ? getPageName(window.location.pathname)
      : 'Admin';

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={[
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        {/* Slide-in panel */}
        <aside
          className={[
            'absolute left-0 top-0 h-full w-64 shadow-2xl transition-transform duration-300 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </aside>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top header ── */}
        <header className={`h-16 flex items-center px-6 flex-shrink-0 border-b z-10 shadow-sm ${
          isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-neutral-100'
        }`}>
          {/* Left */}
          <div className="flex items-center gap-3 flex-1">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>Admin</span>
              <ChevronRight size={14} className={isDark ? 'text-slate-600' : 'text-gray-300'} />
              <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>{pageName}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Live notification bell */}
            <NotificationBell />

            {/* User avatar */}
            <div className={`flex items-center gap-2.5 pl-3 border-l ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              <img
                src={
                  user?.avatar
                    ? getAvatarUrl(user.avatar)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=1e3a3f&color=ffffff&size=40`
                }
                alt={user?.name || 'Admin'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
              />
              <div className="hidden sm:block">
                <p className={`text-sm font-semibold leading-none ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                  {user?.name || 'Admin'}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{user?.role || 'Administrateur'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
