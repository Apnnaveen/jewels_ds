// Dashboard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div>
      <h1>Welcome, {name || 'Driver'}!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
