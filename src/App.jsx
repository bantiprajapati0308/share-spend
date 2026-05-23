import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import TopBar from './components/TopBar';
import BottomNavigation from './components/BottomNavigation';
import Trip from './components/Trip';
import Member from './components/Member';
import Expense from './components/Expense';
import Report from './components/Report';
import AuthScreen from './components/AuthScreen';
import Registration from './components/Registration';
import DailySpends from './modules/DailySpends';
import BorrowLend from './modules/BorrowLend';
import LimitsManager from './modules/DailySpends/LimitsManager';
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
  const [showRegister, setShowRegister] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsAuthLoading(false); // Auth check complete
    });
    return () => unsubscribe();
  }, []);

  // Show loader while Firebase checks authentication
  if (isAuthLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return showRegister
      ? <Registration onRegistered={() => setShowRegister(false)} />
      : <AuthScreen onRegister={() => setShowRegister(true)} />;
  }

  return (
    <CategoryProvider>
      <div style={{ paddingBottom: '70px' }}>
        <ErrorBoundary>
          <TopBar />
          <Routes>
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
            <Route path="/daily-expenses/limits-manager" element={<LimitsManager />} />
            <Route path="/breakdown-report" element={<BreakdownReport />} />
            <Route path="/daily-expenses/master-report" element={<MasterReportWrapper />} />
            <Route path="/lending" element={<BorrowLend />} />
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
