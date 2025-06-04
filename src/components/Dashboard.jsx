import React from 'react';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div>
      <h2>Welcome, {user?.name}!</h2>
      <p>Email: {user?.email}</p>
      <p>Device ID: {user?.device_id}</p>
      <p>Token: {user?.token}</p>
    </div>
  );
}
