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
        <Route path="/share-spend/" element={<Trip />} />
        <Route path="/share-spend/members" element={<Member />} />
        <Route path="/share-spend/expenses" element={<Expense />} />
        <Route path="/share-spend/report" element={<Report />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
