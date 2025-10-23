import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './components/Login';
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
import Notification from './components/Notification';
import ChangePassword from './components/ChangePassword';
import { logoutStatus } from './api'; // ensure correct API path

// 🧩 Protected Route Component
function ProtectedRoute({ element: Component }) {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? <Component /> : <Navigate to="/" replace />;
}

// 🧠 Custom hook for inactivity auto logout + cross-tab sync
function useInactivityLogout() {
  const navigate = useNavigate();

  const MAX_INACTIVE_TIME = 2 * 60 * 60 * 1000; // 2 hours
  // const MAX_INACTIVE_TIME = 1 * 60 * 1000; // for testing

  let timer;

  const handleAutoLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.email) {
        await logoutStatus(user.email); // update backend logout status
      }
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      alert('Session expired due to inactivity. Please log in again.');
      navigate('/');
    }
  };

  const resetTimer = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
    clearTimeout(timer);
    timer = setTimeout(() => {
      handleAutoLogout();
    }, MAX_INACTIVE_TIME);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    const handleStorageChange = (e) => {
      // 🔄 Listen for logout from another tab
      if (e.key === 'user' && !e.newValue) {
        alert('Session expired. Please log in again.');
        navigate('/');
      }
    };

    events.forEach(event => window.addEventListener(event, resetTimer));
    window.addEventListener('storage', handleStorageChange);

    const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
    if (Date.now() - lastActivity > MAX_INACTIVE_TIME) {
      handleAutoLogout();
    } else {
      resetTimer();
    }

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timer);
    };
  }, []);
}

// -------------------- App Wrapper --------------------
function AppWrapper({ user }) {
  useInactivityLogout(); // activate auto logout

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={<ChangePassword/>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} />} />
      <Route path="/available-jobs" element={<ProtectedRoute element={AvailableJobs} />} />
      <Route path="/scheduled-jobs" element={<ProtectedRoute element={ScheduledJobs} />} />
      <Route path="/upcoming-journeys" element={<ProtectedRoute element={UpcomingJourneys} />} />
      <Route path="/completed-jobs" element={<ProtectedRoute element={Completed_journeys} />} />
      <Route path="/tomorrow-journeys" element={<ProtectedRoute element={Tomorrow_journeys} />} />
      <Route path="/driverlist" element={<ProtectedRoute element={DriverList} />} />
      <Route path="/bid-history" element={<ProtectedRoute element={BidHistory} />} />
      <Route path="/notification" element={<ProtectedRoute element={Notification} />} />
      <Route path="/profile" element={<ProtectedRoute element={ProfilePage} />} />
    </Routes>
  );
}

// -------------------- Main App --------------------
function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Optional: auto-refresh app every 30 mins
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 1800000); // 30 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <JobsCountsProvider user={user}>
      <Router>
        <AppWrapper user={user} />
      </Router>
    </JobsCountsProvider>
  );
}

export default App;
