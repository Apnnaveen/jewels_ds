import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AvailableJobs from './components/Available_jobs';
import ScheduledJobs from './components/ScheduledJobs'; // Adjust path if needed
import Dashboard from './components/Dashboard';
import Bidjobs from './components/BidHistory';
import ForgotPassword from './components/ForgotPassword';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/available-jobs" element={<AvailableJobs />} />
        <Route path="/bid-history" element={<Bidjobs />} />
        <Route path="/scheduled-jobs" element={<ScheduledJobs />} />
      </Routes>
    </Router>
  );
}

export default App;
