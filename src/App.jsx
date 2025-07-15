import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
// import AvailableJobs from './components/Available_jobs';
import AvailableJobs from './components/AvailableJob';
import ScheduledJobs from './components/ScheduledJobs';
import UpcomingJourneys from './components/UpcomingJourneys';
import Tomorrow_journeys from './components/Tomorrow_journeys';
import Completed_journeys from './components/Completed_journeys';
import Dashboard from './components/Dashboard';
import BidHistory from './components/BidHistory';
import ForgotPassword from './components/ForgotPassword';
import ProfilePage from './components/ProfilePage';
import DriverList from './components/DriverList';
import VerifyOTP from './components/VerifyOTP';
import ResetPassword from './components/ResetPassword';
import { JobsCountsProvider } from './components/JobsCountsProvider';


function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 1800000); 

    return () => clearInterval(interval); // Clear on unmount
  }, []);
  return (
    <JobsCountsProvider user={user}>
      <Router>
        <Routes>
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/available-jobs" element={<AvailableJobs />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/bid-history" element={<BidHistory />} />
          <Route path="/scheduled-jobs" element={<ScheduledJobs />} />
          <Route path="/upcoming-journeys" element={<UpcomingJourneys />} />
          <Route path="/completed-jobs" element={<Completed_journeys />} />
          <Route path="/tomorrow-journeys" element={<Tomorrow_journeys />} />
          <Route path="/driverlist" element={<DriverList />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Router>
    </JobsCountsProvider>

  );
}

export default App;
