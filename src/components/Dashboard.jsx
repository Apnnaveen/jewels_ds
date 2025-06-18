import React, { useState } from 'react';
// import Sidebar from './Sidebar';
import Available_jobs from './Available_jobs';
import ProfilePage from './ProfilePage';
// import './css/Dashboard.css';
import AvailableJob from './AvailableJob';

export default function Dashboard() {
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
        return <AvailableJob/>
        // return <Available_jobs user={user} setActiveItem={setActiveItem} />;
      case 'profile':
        return <ProfilePage driverId={user.id} />;
      default:
        return <p>Select a menu item to view content.</p>;
    }
  };

  return (
    <>
      {/* <Sidebar
        user={user}
        onLogout={handleLogout}
        open={true}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      /> */}
      <div className="">
        {renderContent()}
      </div>
    </>
  );
}