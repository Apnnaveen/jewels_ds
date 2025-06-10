import React from 'react';
import { useLocation } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import './css/Available.css';

const Bidjobs = () => {
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  return (
    <div style={{ padding: '30px' }}>
      <JobsTabs activeTab="bid" user={user} />
      <div className="available-jobs-container">
        {/* Your Bid History content here */}
        <h2>Bid History</h2>
      </div>
    </div>
  );
};

export default Bidjobs;