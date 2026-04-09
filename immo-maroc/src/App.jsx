import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from './context/AppContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ScrollToTop, BackToTop } from './components/common/BackToTop';

// Public pages
import Home from './pages/Home';
import Search from './pages/Search';
import PropertyDetail from './pages/PropertyDetail';
import SellProperty from './pages/SellProperty';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Auth
import Login from './pages/auth/Login';

// Agent dashboard
import AgentLayout from './pages/agent/Layout';
import AgentDashboard from './pages/agent/Dashboard';
import AgentListings from './pages/agent/Listings';
import AddProperty from './pages/agent/AddProperty';
import AgentLeads from './pages/agent/Leads';

// Admin dashboard
import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminListings from './pages/admin/Listings';
import AdminAgents from './pages/admin/Agents';
import CreateAgent from './pages/admin/CreateAgent';
import EditAgent from './pages/admin/EditAgent';
import SellRequests from './pages/admin/SellRequests';
import AdminStats from './pages/admin/Stats';
import AdminLeads from './pages/admin/Leads';
import ContactMessages from './pages/admin/ContactMessages';

// Agent profile
import AgentProfile from './pages/agent/Profile';

// Normalize role to lowercase for all comparisons
const userRole = (user) => user?.role?.toLowerCase();
const isAdmin = (user) => userRole(user) === 'admin';

function RequireAuth({ children, role }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  // role="admin" → only admin; role="agent" → agent OR admin (admin can access agent panel too)
  if (role === 'admin' && !isAdmin(user)) return <Navigate to="/agent" replace />;
  if (role === 'agent' && !['agent', 'admin'].includes(userRole(user))) return <Navigate to="/connexion" replace />;
  return children;
}

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.slice(0, 2) || 'fr';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/recherche" element={<PublicLayout><Search /></PublicLayout>} />
        <Route path="/propriete/:id" element={<PublicLayout><PropertyDetail /></PublicLayout>} />
        <Route path="/vendre" element={<PublicLayout><SellProperty /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

        <Route path="/connexion" element={<Login />} />

        <Route path="/agent" element={<RequireAuth role="agent"><AgentLayout /></RequireAuth>}>
          <Route index element={<AgentDashboard />} />
          <Route path="annonces" element={<AgentListings />} />
          <Route path="ajouter" element={<AddProperty />} />
          <Route path="modifier/:id" element={<AddProperty />} />
          <Route path="leads" element={<AgentLeads />} />
          <Route path="profil" element={<AgentProfile />} />
        </Route>

        <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="annonces" element={<AdminListings />} />
          <Route path="agents" element={<AdminAgents />} />
          <Route path="agents/creer" element={<CreateAgent />} />
          <Route path="agents/modifier/:id" element={<EditAgent />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="demandes" element={<SellRequests />} />
          <Route path="messages" element={<ContactMessages />} />
          <Route path="stats" element={<AdminStats />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
