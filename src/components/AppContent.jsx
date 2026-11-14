import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import TopBar from './TopBar';
import BottomNavigation from './BottomNavigation';
import ErrorBoundary from './common/ErrorBoundary';
import InlineLoader from './common/InlineLoader';
import styles from './AppContent.module.scss';
import { CategoryProvider } from '../modules/DailySpends/context/CategoryContext.jsx';
import JoinTripDialog from '../modules/Trip/components/JoinTripDialog';
import useInviteCheck from '../modules/Trip/hooks/useInviteCheck';
import { aiAccessApi } from '../services/api/aiAccessApi';

const Trip = lazy(() => import('../modules/Trip'));
const Member = lazy(() => import('../modules/Trip/components/Member'));
const Expense = lazy(() => import('../modules/Trip/components/Expense'));
const Report = lazy(() => import('../modules/Trip/components/Report'));
const DailySpends = lazy(() => import('../modules/DailySpends'));
const BorrowLend = lazy(() => import('../modules/BorrowLend'));
const HelpCenter = lazy(() => import('../modules/HelpCenter'));
const SecuritySettings = lazy(() => import('../pages/settings/security/SecuritySettings'));

function AppContent({ user, profileReady }) {
  const navigate = useNavigate();
  const { pendingInvites, setPendingInvites, refreshInvites } = useInviteCheck(user?.email);
  const [activeInvite, setActiveInvite] = useState(null);
  const [aiAccess, setAiAccess] = useState({ email: '', enabled: false });
  const userEmail = String(user?.email || '').trim().toLocaleLowerCase();

  useEffect(() => {
    let cancelled = false;

    const checkAiAccess = async () => {
      const result = await aiAccessApi.getAccess();
      if (cancelled) return;
      if (!result.success) {
        console.error('Could not verify AI feature access:', result.error);
        toast.error('Could not verify AI feature access. AI features remain disabled.');
        return;
      }

      setAiAccess({ email: userEmail, enabled: result.data?.enabled === true });
    };

    checkAiAccess().catch((error) => {
      if (cancelled) return;
      console.error('Could not verify AI feature access:', error);
      toast.error('Could not verify AI feature access. AI features remain disabled.');
    });

    return () => {
      cancelled = true;
    };
  }, [userEmail]);

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
    <CategoryProvider bootstrapReady={profileReady}>
      <div className={styles.appShell}>
        <ErrorBoundary>
          <TopBar onInviteNotificationClick={handleInviteNotificationClick} />
          <Suspense fallback={<InlineLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/daily-expenses" />} />
              <Route path="/trip" element={<Trip />} />
              <Route path="/members/:tripId" element={<Member />} />
              <Route path="/expenses/:tripId" element={<Expense />} />
              <Route path="/report/:tripId" element={<Report />} />
              <Route path="/daily-expenses" element={<DailySpends aiEnabled={aiAccess.email === userEmail && aiAccess.enabled} />} />
              <Route path="/lending" element={<BorrowLend aiEnabled={aiAccess.email === userEmail && aiAccess.enabled} />} />
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
  profileReady: PropTypes.bool.isRequired,
};

export default AppContent;
