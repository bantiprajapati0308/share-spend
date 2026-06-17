import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { ensureUserProfile } from './hooks/useUserProfile';
import TopBar from './components/TopBar';
import BottomNavigation from './components/BottomNavigation';
import Trip from './modules/Trip';
import Member from './modules/Trip/components/Member';
import Expense from './modules/Trip/components/Expense';
import Report from './modules/Trip/components/Report';
import AuthModule from './modules/Auth';
import DailySpends from './modules/DailySpends';
import BorrowLend from './modules/BorrowLend';
import HelpCenter from './modules/HelpCenter';
import BreakdownReport from './modules/DailySpends/components/BreakdownReport';
import MasterReport from './modules/DailySpends/MasterReport';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import { CategoryProvider } from './modules/DailySpends/context/CategoryContext.jsx';
import FullScreenLoader from './components/common/FullScreenLoader';
import MaintenancePage from './components/MaintenancePage';
import JoinTripDialog from './modules/Trip/components/JoinTripDialog';
import useInviteCheck from './modules/Trip/hooks/useInviteCheck';

// MasterReport wrapper to handle location state
function MasterReportWrapper() {
  const location = useLocation();
  const { startDate, endDate } = location.state || {};
  return <MasterReport startDate={startDate} endDate={endDate} />;
}

const IS_MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

function AppContent({ user }) {
  const navigate = useNavigate();
  const { pendingInvites, setPendingInvites, refreshInvites } = useInviteCheck(user?.email);

  // Active invite shown in dialog (one at a time)
  const [activeInvite, setActiveInvite] = useState(null);

  // After login, check for pending invites
  useEffect(() => {
    if (user?.email) refreshInvites();
  }, [user?.email]);

  // Auto-show dialog when pending invites arrive
  useEffect(() => {
    if (pendingInvites.length > 0 && !activeInvite) {
      setActiveInvite(pendingInvites[0]);
    }
  }, [pendingInvites]);

  // Called from NotificationBell when a trip_invite notification is clicked
  const handleInviteNotificationClick = useCallback((notif) => {
    // Build a minimal invite object from the notification data
    setActiveInvite({
      id: notif.inviteId,
      tripId: notif.tripId,
      tripName: notif.tripName,
      invitedByEmail: notif.invitedByEmail,
    });
  }, []);

  const handleInviteAccepted = (tripId) => {
    // Remove accepted invite and advance to next pending
    const remaining = pendingInvites.filter((i) => i.id !== activeInvite?.id);
    setPendingInvites(remaining);
    setActiveInvite(remaining.length > 0 ? remaining[0] : null);
    navigate('/trip');
  };

  const handleInviteRejected = () => {
    const remaining = pendingInvites.filter((i) => i.id !== activeInvite?.id);
    setPendingInvites(remaining);
    setActiveInvite(remaining.length > 0 ? remaining[0] : null);
  };

  return (
    <CategoryProvider>
      <div style={{ paddingBottom: '70px' }}>
        <ErrorBoundary>
          <TopBar onInviteNotificationClick={handleInviteNotificationClick} />
          <Routes>
            <Route path="/" element={<Navigate to="/daily-expenses" />} />
            <Route path="/trip" element={<Trip />} />
            <Route path="/members/:tripId" element={<Member />} />
            <Route path="/expenses/:tripId" element={<Expense />} />
            <Route path="/report/:tripId" element={<Report />} />
            <Route path="/daily-expenses" element={<DailySpends />} />
            <Route path="/breakdown-report" element={<BreakdownReport />} />
            <Route path="/daily-expenses/master-report" element={<MasterReportWrapper />} />
            <Route path="/lending" element={<BorrowLend />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
        <BottomNavigation />
        <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />

        {/* Invite accept/reject dialog — shown when pending invites exist */}
        {activeInvite && (
          <JoinTripDialog
            invite={activeInvite}
            onAccepted={handleInviteAccepted}
            onRejected={handleInviteRejected}
            onClose={() => setActiveInvite(null)}
          />
        )}
      </div>
    </CategoryProvider>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  if (IS_MAINTENANCE) {
    return <MaintenancePage />;
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Keep the FullScreenLoader visible during profile creation + category seeding.
        // This prevents CategoryContext from fetching an empty list before seeding finishes,
        // and gives the user visible feedback during Google first-login.
        setIsAuthLoading(true);
        await ensureUserProfile(firebaseUser);
      }
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Show loader while Firebase checks authentication
  if (isAuthLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <AuthModule />;
  }

  return <AppContent user={user} />;
}

export default App;
