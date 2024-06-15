import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavigationBar from './components/Navbar';
import Trip from './components/Trip';
import Member from './components/Member';
import Expense from './components/Expense';
import Report from './components/Report';
import Footer from './components/Footer';

function App() {
  return (
    <div>
      <NavigationBar />
      <Routes>
        <Route path="/trip" element={<Trip />} />
        <Route path="/members" element={<Member />} />
        <Route path="/expenses" element={<Expense />} />
        <Route path="/report" element={<Report />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
