import React from 'react';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'Quotation', path: '/available-jobs', key: 'available' },
  { label: 'History', path: '/bid-history', key: 'bid' },
  { label: 'Scheduled Jobs', path: '/scheduled-jobs', key: 'scheduled' },
  { label: 'Upcoming Journeys', path: '/upcoming-journeys', key: 'upcoming' },
  { label: 'Completed Jobs', path: '/completed-jobs', key: 'completed' },
];

const JobsTabs = ({ activeTab, user }) => {
  const navigate = useNavigate();

  return (
    <div className="jobs-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
          onClick={() => navigate(tab.path, { state: { user } })}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default JobsTabs;
