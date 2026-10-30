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
import Feedback from './pages/Feedback';
import BrokerRequests from './pages/BrokerRequests';
import ProgramSettings from './pages/ProgramSettings';
import Join from './pages/Join';
import Download from './pages/Download';
import Faq from './pages/Faq';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import TwoStep from './pages/TwoStep';
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

// Admin pages need the password AND the authenticator-app code (session level 'aal2').
const ProtectedRoute = ({ children, session, twoStepDone }) => {
  if (!session) return <Navigate to="/login" replace />;
  if (!twoStepDone) return <Navigate to="/two-step" replace />;
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
  const [twoStepDone, setTwoStepDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const update = async (session) => {
      let done = false;
      if (session) {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        done = data?.currentLevel === 'aal2';
      }
      setTwoStepDone(done);
      setSession(session);
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await update(session);
      setLoading(false);
    });

    // Supabase calls this inside its own lock; the level check runs just after it.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => update(session), 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/two-step" element={!session ? <Navigate to="/login" replace /> : twoStepDone ? <Navigate to="/" replace /> : <TwoStep />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/support" element={<Support />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/download" element={<Download />} />
        <Route path="/faq" element={<Faq />} />

        <Route path="/" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Dashboard /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Users /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Events /></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Rewards /></ProtectedRoute>} />
        <Route path="/redemptions" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Redemptions /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Transactions /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Referrals /></ProtectedRoute>} />
        <Route path="/help-contact" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><HelpContact /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><Feedback /></ProtectedRoute>} />
        <Route path="/broker-requests" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><BrokerRequests /></ProtectedRoute>} />
        <Route path="/program-settings" element={<ProtectedRoute session={session} twoStepDone={twoStepDone}><ProgramSettings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
