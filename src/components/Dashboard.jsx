import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Available_jobs from './Available_jobs';
import ChangePassword from './ChangePassword';
import DeleteAccount from './DeleteAccount';
import ProfilePage from './ProfilePage';
import './css/Dashboard.css';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');

  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : { name: '', email: '' };
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Renders content based on the selected sidebar item
  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Available_jobs user={user} setActiveItem={setActiveItem} />;
      case 'change-password':
        return <ChangePassword />;
      case 'delete-account':
        return <DeleteAccount />;
      case 'profile':
        return <ProfilePage driverId={user.id} />;
      default:
        return <p>Select a menu item to view content.</p>;
    }
  };

  // Format heading title from kebab-case to Title Case
  const formatTitle = (key) => {
    return key
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <>
      {/* Toggle Sidebar Button */}
      <button className="global-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Layout */}
      <div className="dashboard-layout">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          open={sidebarOpen}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <h2>{formatTitle(activeItem)}</h2>
          {renderContent()}
        </div>
      </div>
    </>
  );
}
