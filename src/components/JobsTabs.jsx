import React from 'react';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'Quotation', path: '/available-jobs', key: 'available' },
  { label: 'History', path: '/bid-history', key: 'bid' },
  { label: 'Scheduled Jobs', path: '/scheduled-jobs', key: 'scheduled' },
  { label: 'Upcoming Journeys', path: '/upcoming-journeys', key: 'upcoming' },
  { label: 'Tomorrow Journeys', path: '/tomorrow-journeys', key: 'tomorrow' },
  { label: 'Completed Jobs', path: '/completed-jobs', key: 'completed' },
];

const JobsTabs = ({ activeTab, user }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
  {tabs.map((tab) => (
    <button
      key={tab.key}
      onClick={() => navigate(tab.path, { state: { user } })}
      className={`py-2 px-4 rounded-md text-sm font-medium text-white transition-all duration-200
        ${activeTab === tab.key
          ? 'bg-blue-600 hover:bg-blue-700'
          : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
    >
      {tab.label}
    </button>
  ))}
</div>

  );
};

export default JobsTabs;
