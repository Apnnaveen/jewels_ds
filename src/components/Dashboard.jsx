import React from 'react';
import Sidebar from './Sidebar';
import Available_jobs from './Available_jobs';

export default function Dashboard() {
  // Import the AvailableJobs page/component

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px', padding: '30px', flex: 1 }}>
        {/* Call the AvailableJobs page/component here */}
        <Available_jobs />
      </div>
    </div>
  );
}
