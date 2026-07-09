import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import TopBar from './TopBar';
import BottomNavigation from './BottomNavigation';
import ErrorBoundary from './common/ErrorBoundary';
import FullScreenLoader from './common/FullScreenLoader';
import { CategoryProvider } from '../modules/DailySpends/context/CategoryContext.jsx';
import JoinTripDialog from '../modules/Trip/components/JoinTripDialog';
import useInviteCheck from '../modules/Trip/hooks/useInviteCheck';

const Trip = lazy(() => import('../modules/Trip'));
const Member = lazy(() => import('../modules/Trip/components/Member'));
const Expense = lazy(() => import('../modules/Trip/components/Expense'));
const Report = lazy(() => import('../modules/Trip/components/Report'));
const DailySpends = lazy(() => import('../modules/DailySpends'));
const BorrowLend = lazy(() => import('../modules/BorrowLend'));
const HelpCenter = lazy(() => import('../modules/HelpCenter'));
const SecuritySettings = lazy(() => import('../pages/settings/security/SecuritySettings'));

function AppContent({ user }) {
  const navigate = useNavigate();
  const { pendingInvites, setPendingInvites, refreshInvites } = useInviteCheck(user?.email);
  const [activeInvite, setActiveInvite] = useState(null);

  useEffect(() => {
    if (user?.email) refreshInvites();
  }, [refreshInvites, user?.email]);

  useEffect(() => {
    if (pendingInvites.length > 0 && !activeInvite) {
      setActiveInvite(pendingInvites[0]);
    }
  }, [activeInvite, pendingInvites]);

  const handleInviteNotificationClick = useCallback((notif) => {
    setActiveInvite({
      id: notif.inviteId,
      tripId: notif.tripId,
      tripName: notif.tripName,
      invitedByEmail: notif.invitedByEmail,
    });
  }, []);

  const handleInviteAccepted = () => {
    const remaining = pendingInvites.filter((invite) => invite.id !== activeInvite?.id);
    setPendingInvites(remaining);
    setActiveInvite(remaining.length > 0 ? remaining[0] : null);
    navigate('/trip');
  };

  const handleInviteRejected = () => {
    const remaining = pendingInvites.filter((invite) => invite.id !== activeInvite?.id);
    setPendingInvites(remaining);
    setActiveInvite(remaining.length > 0 ? remaining[0] : null);
  };

  return (
    <CategoryProvider>
      <div style={{ paddingBottom: '60px' }}>
        <ErrorBoundary>
          <TopBar onInviteNotificationClick={handleInviteNotificationClick} />
          <Suspense fallback={<FullScreenLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/daily-expenses" />} />
              <Route path="/trip" element={<Trip />} />
              <Route path="/members/:tripId" element={<Member />} />
              <Route path="/expenses/:tripId" element={<Expense />} />
              <Route path="/report/:tripId" element={<Report />} />
              <Route path="/daily-expenses" element={<DailySpends />} />
              <Route path="/lending" element={<BorrowLend />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>

        <BottomNavigation />
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

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

AppContent.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
  }).isRequired,
};

export default AppContent;
