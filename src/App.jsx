import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import NavigationBar from './components/Navbar';
import Trip from './components/Trip';
import Member from './components/Member';
import Expense from './components/Expense';
import Report from './components/Report';
import Footer from './components/Footer';
import AuthScreen from './components/AuthScreen';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div>
      <NavigationBar />
      <Routes>
        <Route path="/share-spend/" element={<Trip />} />
        <Route path="/share-spend/members/:tripId" element={<Member />} />
        <Route path="/share-spend/expenses/:tripId" element={<Expense />} />
        <Route path="/share-spend/report/:tripId" element={<Report />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
