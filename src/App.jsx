import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import NavigationBar from './components/Navbar';
import Trip from './components/Trip';
import Member from './components/Member';
import Expense from './components/Expense';
import Report from './components/Report';
import Footer from './components/Footer';
import AuthScreen from './components/AuthScreen';
import Registration from './components/Registration';
import ErrorBoundary from './components/common/ErrorBoundary';

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
    <div>
      <ErrorBoundary>
        <NavigationBar />
        <Routes>
          <Route path="/share-spend/trip" element={<Trip />} />
          <Route path="/share-spend/members/:tripId" element={<Member />} />
          <Route path="/share-spend/expenses/:tripId" element={<Expense />} />
          <Route path="/share-spend/report/:tripId" element={<Report />} />
          <Route path="*" element={<Navigate to="/share-spend/" />} />
        </Routes>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}

export default App;
