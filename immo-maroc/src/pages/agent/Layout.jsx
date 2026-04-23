import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, Inbox, User, LogOut,
  Menu, X, Building2, ChevronRight, ListFilter
} from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../../api/properties';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
    isActive
      ? 'bg-white text-[#0D6EFD] shadow-sm font-semibold'
      : 'text-white/60 hover:text-white hover:bg-white/10'
  }`;

export default function AgentLayout() {
  const { user, logout } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/connexion'); };

  const Sidebar = ({ mobile = false }) => (
    <div className="flex flex-col h-full bg-[#0D1A1C]">

      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 text-white">
          <Building2 size={20} className="text-[#0D6EFD]" />
          <span className="font-bold text-base tracking-tight">IMMO 21</span>
        </Link>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-6">

        {/* GÉNÉRAL */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-white/25 uppercase">Général</p>
          <div className="space-y-0.5">
            <NavLink to="/agent" end onClick={() => setSidebarOpen(false)} className={navLinkClass}>
              <LayoutDashboard size={16} />
              {t('agent.nav.dashboard')}
            </NavLink>
          </div>
        </div>

        {/* ANNONCES */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-white/25 uppercase">Annonces</p>
          <div className="space-y-0.5">
            <NavLink to="/agent/annonces" onClick={() => setSidebarOpen(false)} className={navLinkClass}>
              <ListFilter size={16} />
              {t('agent.nav.listings')}
            </NavLink>
            <NavLink to="/agent/ajouter" onClick={() => setSidebarOpen(false)} className={navLinkClass}>
              <PlusCircle size={16} />
              {t('agent.nav.add')}
            </NavLink>
          </div>
        </div>

        {/* LEADS */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-white/25 uppercase">Leads</p>
          <div className="space-y-0.5">
            <NavLink to="/agent/leads" onClick={() => setSidebarOpen(false)} className={navLinkClass}>
              <Inbox size={16} />
              {t('agent.nav.leads')}
            </NavLink>
          </div>
        </div>

        {/* COMPTE */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-white/25 uppercase">Compte</p>
          <div className="space-y-0.5">
            <NavLink to="/agent/profil" onClick={() => setSidebarOpen(false)} className={navLinkClass}>
              <User size={16} />
              {t('agent.nav.profile')}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Bottom: user + logout */}
      <div className="shrink-0 px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1">
          <img
            src={getAvatarUrl(user?.avatar)}
            alt=""
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-white/40 text-[10px] truncate">{user?.agency}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={15} />
          {t('agent.nav.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-[270px] flex flex-col transition-transform duration-300 ease-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar mobile />
        </aside>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <nav className="hidden sm:flex items-center gap-1.5 text-sm text-neutral-500">
              <span className="font-medium text-neutral-800">Espace Agent</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/agent/profil" className="flex items-center gap-2 pl-1">
              <img
                src={getAvatarUrl(user?.avatar)}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-200"
              />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
