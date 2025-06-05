import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Available_jobs from './Available_jobs'; // Import the actual components
import ChangePassword from './ChangePassword'; // Import the actual components
import DeleteAccount from './DeleteAccount'; // Import the actual components
import ProfilePage from './ProfilePage'; // Import the actual components
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
// console.log('User:', user);
  // Render content based on activeItem
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
    <div className="dashboard-layout">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className={`dashboard-main ${sidebarOpen ? 'with-sidebar' : ''}`}>
        <h2>
          {activeItem.charAt(0).toUpperCase() + activeItem.slice(1).replace('-', ' ')}
        </h2>
        {renderContent()}
      </div>
    </div>
  </>
);
}
