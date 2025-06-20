import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
// import AvailableJobs from './components/Available_jobs';
import AvailableJobs from './components/AvailableJob';
import ScheduledJobs from './components/ScheduledJobs'; 
import UpcomingJourneys from './components/UpcomingJourneys'; 
import Tomorrow_journeys from './components/Tomorrow_journeys';
import Completed_journeys from './components/Completed_journeys';
import Dashboard from './components/Dashboard';
import Bidjobs from './components/BidHistory';
import ForgotPassword from './components/ForgotPassword';
import ProfilePage from './components/ProfilePage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/available-jobs" element={<AvailableJobs />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/bid-history" element={<Bidjobs />} />
        <Route path="/scheduled-jobs" element={<ScheduledJobs />} />
        <Route path="/upcoming-journeys" element={<UpcomingJourneys />} />
        <Route path="/completed-jobs" element={<Completed_journeys />} />
        <Route path="/tomorrow-journeys" element={<Tomorrow_journeys />} />
        
      </Routes>
    </Router>
  );
}

export default App;
