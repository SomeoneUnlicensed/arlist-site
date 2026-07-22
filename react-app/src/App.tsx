import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CliAuth from './pages/CliAuth';
import Status from './pages/Status';
import Home from './pages/Home';
import { LegalPage } from './pages/LegalPage';
import { LegalDocumentPage } from './pages/LegalDocumentPage';
import { ContactsPage, DocsPage, EducationPage, GrusnubPage, LandingsPage, ManifestPage, PrivacyPage, ProductsPage, PromoPage, VspyshkaPage } from './pages/PublicPages';

function RequireAccount({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const [state, setState] = useState<'loading' | 'allowed' | 'login' | 'profile'>('loading');

  useEffect(() => {
    axios.get('/api/auth/profile')
      .then(({ data }) => setState(admin && data.role !== 'ADMIN' ? 'profile' : 'allowed'))
      .catch(() => setState('login'));
  }, [admin]);

  if (state === 'loading') return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Проверяем доступ…</div>;
  if (state === 'login') return <Navigate to={`/login?return_to=${encodeURIComponent(window.location.pathname)}`} replace />;
  if (state === 'profile') return <Navigate to="/profile" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/forEdu" element={<EducationPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/landings" element={<LandingsPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/legal/geotekt-policies" element={<LegalDocumentPage />} />
          <Route path="/promo" element={<PromoPage />} />
          <Route path="/promo/manifest" element={<ManifestPage />} />
          <Route path="/vspyshka" element={<VspyshkaPage />} />
          <Route path="/grusnub" element={<GrusnubPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/profile" element={<RequireAccount><Profile /></RequireAccount>} />
          <Route path="/admin" element={<RequireAccount admin><Admin /></RequireAccount>} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/cli/auth" element={<CliAuth />} />
          <Route path="/status" element={<Status />} />
          <Route path="/transparency" element={<Navigate to="/status" replace />} />
          <Route path="/transparancy" element={<Navigate to="/status" replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
