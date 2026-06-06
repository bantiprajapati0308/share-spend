import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { ensureUserProfile } from './hooks/useUserProfile';
import TopBar from './components/TopBar';
import BottomNavigation from './components/BottomNavigation';
import Trip from './components/Trip';
import Member from './components/Member';
import Expense from './components/Expense';
import Report from './components/Report';
import AuthModule from './modules/Auth';
import DailySpends from './modules/DailySpends';
import BorrowLend from './modules/BorrowLend';
import HelpCenter from './modules/HelpCenter';
import BreakdownReport from './modules/DailySpends/components/BreakdownReport';
import MasterReport from './modules/DailySpends/MasterReport';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedTripRoute from './components/common/ProtectedTripRoute';
import { ToastContainer } from 'react-toastify';
import { CategoryProvider } from './modules/DailySpends/context/CategoryContext.jsx';
import FullScreenLoader from './components/common/FullScreenLoader';

// MasterReport wrapper to handle location state
function MasterReportWrapper() {
  const location = useLocation();
  const { startDate, endDate } = location.state || {};
  return <MasterReport startDate={startDate} endDate={endDate} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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

  return (
    <CategoryProvider>
      <div style={{ paddingBottom: '70px' }}>
        <ErrorBoundary>
          <TopBar />
          <Routes>
            <Route path="/" element={<Navigate to="/daily-expenses" />} />
            <Route path="/trip" element={<Trip />} />
            <Route path="/members/:tripId" element={
              <ProtectedTripRoute>
                <Member />
              </ProtectedTripRoute>
            } />
            <Route path="/expenses/:tripId" element={
              <ProtectedTripRoute>
                <Expense />
              </ProtectedTripRoute>
            } />
            <Route path="/report/:tripId" element={
              <ProtectedTripRoute>
                <Report />
              </ProtectedTripRoute>
            } />
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
      </div>
    </CategoryProvider>
  );
}

export default App;
