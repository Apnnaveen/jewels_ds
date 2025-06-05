import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    navigate('/dashboard', { state: { user } });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">🌟 JewelApp</div>
      <ul className="sidebar-menu">
        <li onClick={handleDashboard}>🏠 Dashboard</li>
        <li onClick={() => alert('Coming soon')}>📦 Products</li>
        <li onClick={() => alert('Coming soon')}>🧑‍🤝‍🧑 Users</li>
        <li onClick={handleLogout}>🚪 Logout</li>
      </ul>
    </div>
  );
}