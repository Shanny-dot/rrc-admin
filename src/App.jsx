import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Events from './pages/Events';
import Rewards from './pages/Rewards';
import Redemptions from './pages/Redemptions';
import Transactions from './pages/Transactions';
import Referrals from './pages/Referrals';
import HelpContact from './pages/HelpContact';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Support from './pages/Support';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Sidebar from './components/Sidebar';

// A password-reset email link can land on any page of this site (Supabase falls back to
// the Site URL). Send it to the "Set a new password" page, keeping the link's token.
if (typeof window !== 'undefined' && window.location.pathname !== '/reset-password') {
  const h = window.location.hash;
  if (h.includes('type=recovery') || h.includes('error_code=otp_expired')) {
    window.history.replaceState(null, '', '/reset-password' + window.location.search + h);
  }
}

const ProtectedRoute = ({ children, session }) => {
  if (!session) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        {children}
      </div>
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route path="/" element={<ProtectedRoute session={session}><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute session={session}><Users /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute session={session}><Events /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute session={session}><Rewards /></ProtectedRoute>} />
        <Route path="/redemptions" element={<ProtectedRoute session={session}><Redemptions /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute session={session}><Transactions /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute session={session}><Referrals /></ProtectedRoute>} />
        <Route path="/help-contact" element={<ProtectedRoute session={session}><HelpContact /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
