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

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Available_jobs />;
      case '':
        return <ChangePassword />;
      case 'delete-account':
        return <DeleteAccount />;
      case 'profile':
        return <ProfilePage driverId={user.id} />;
      default:
        return <p>Select a menu item to view content.</p>;
    }
  };

  return (
    <>
      {/* Toggle Sidebar Button */}
      <button className="global-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Layout */}
      <div className={`dashboard-layout${sidebarOpen ? ' sidebar-open' : ' sidebar-closed'}`}>
        <Sidebar
          user={user}
          onLogout={handleLogout}
          open={sidebarOpen}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

       <div
          className={
            activeItem === 'dashboard'
              ? `dashboard-main${sidebarOpen ? ' with-sidebar' : ' full-width'}`
              : `page-main${sidebarOpen ? ' with-sidebar' : ' full-width'}`
          }
        >
          {activeItem !== 'dashboard' &&
            activeItem !== 'delete-account' &&
            activeItem !== 'change-password' &&
            activeItem !== 'profile' && (
              <h2>
                {activeItem.charAt(0).toUpperCase() +
                  activeItem.slice(1).replace('-', ' ')}
              </h2>
            )}
          {renderContent()}
        </div>
      </div>
    </>
  );
}