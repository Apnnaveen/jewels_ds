import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobsCounts } from './JobsCountsProvider';

const tabs = [
  { label: 'Quotation', path: '/available-jobs', key: 'available' },
  { label: 'My Quotes', path: '/bid-history', key: 'bid' },
  { label: 'Availability', path: '/scheduled-jobs', key: 'scheduled' },
  { label: 'Tomorrow Journeys', path: '/tomorrow-journeys', key: 'tomorrow' },
  { label: 'Assigned Journeys', path: '/upcoming-journeys', key: 'upcoming' },
  { label: 'Completed Journeys', path: '/completed-jobs', key: 'completed' },
];

const JobsTabs = ({ activeTab, user }) => {
  const navigate = useNavigate();
  const { counts, loading } = useJobsCounts();

  return (

    <div className="w-full">
      {/* Top Scroll Message */}
      <div className="w-full bg-yellow-100 border border-yellow-300 rounded-lg mb-4 overflow-hidden shadow">
        <marquee behavior="scroll" direction="left" className="text-sm text-yellow-800 font-semibold py-2 px-4">
          Please note that the OTP login process will be stopped shortly. Therefore, kindly set your new password through the "Forgot password" option available in the login page. Ignore this message if you have done it already.
        </marquee>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path, { state: { user } })}
            className={`py-3 px-4 rounded-2xl text-sm font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2
        ${activeTab === tab.key
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <span className="flex items-center justify-center gap-1">
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                  {counts[tab.key]}
                </span>
              )}

            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default JobsTabs;