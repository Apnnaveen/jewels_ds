import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Sidebar.css';

export default function Sidebar({ user, onLogout, open, activeItem, setActiveItem }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const id = 'fontawesome-cdn';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

  const menuItems = [
    { key: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { key: '', icon: 'fas fa-lock', label: 'Change Password' },
    { key: 'delete-account', icon: 'fas fa-user-slash', label: 'Delete Account' },
    { key: 'profile', icon: 'fas fa-user', label: 'Profile' },
  ];

  const handleDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    navigate('/dashboard', { state: { user } });
  };

  return (
    <div className={`custom-sidebar ${open ? 'open' : ''}`}>
      <div className="profile-header">
        <div className="profile-pic">
          <i className="fas fa-user-circle fa-4x"></i>
        </div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.key}
            className={activeItem === item.key ? 'active' : ''}
            onClick={() => setActiveItem(item.key)}
          >
            <i className={item.icon}></i> {item.label}
          </li>
        ))}
        <li onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Sign Out
        </li>
      </ul>

      <div className="sidebar-footer">
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
}