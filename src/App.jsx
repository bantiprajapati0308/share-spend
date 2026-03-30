import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import MasterReport from './modules/DailySpends/components/MasterReport';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedTripRoute from './components/common/ProtectedTripRoute';
import { ToastContainer } from 'react-toastify';
import { CategoryProvider } from './modules/DailySpends/context/CategoryContext.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

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
            <Route path="/share-spend/trip" element={<Trip />} />
            <Route path="/share-spend/members/:tripId" element={
              <ProtectedTripRoute>
                <Member />
              </ProtectedTripRoute>
            } />
            <Route path="/share-spend/expenses/:tripId" element={
              <ProtectedTripRoute>
                <Expense />
              </ProtectedTripRoute>
            } />
            <Route path="/share-spend/report/:tripId" element={
              <ProtectedTripRoute>
                <Report />
              </ProtectedTripRoute>
            } />
            <Route path="/share-spend/daily-expenses" element={<DailySpends />} />
            <Route path="/share-spend/limits-manager" element={<LimitsManager />} />
            <Route path="/share-spend/breakdown-report" element={<BreakdownReport />} />
            <Route path="/share-spend/master-report" element={<MasterReport />} />
            <Route path="/share-spend/lending" element={<BorrowLend />} />
            <Route path="*" element={<Navigate to="/share-spend/login" />} />
          </Routes>
        </ErrorBoundary>
        <BottomNavigation />
        <ToastContainer position="top-center" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      </div>
    </CategoryProvider>
  );
}

export default App;
