import React from 'react';
import Sidebar from './Sidebar';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px', padding: '30px', flex: 1 }}>
        <h1>Welcome to Dashboard</h1>
        <p>You are now logged in!</p>
      </div>
    </div>
  );
}
