import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { bid_history } from '../api';

import Header from './MainHeader/Header';


const BidHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('bid');
  const [bidHistory, setBidHistory] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    booking_ref_id: '',
    biding_amount: '',
    from_address: '',
    to_address: '',
    pickup_date_from: '',
    pickup_date_to: ''
  });

  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user?.driver_id || !user?.token) {
      navigate('/login');
      return;
    }

    const fetchBidHistory = async () => {
      try {
        const response = await bid_history(user.driver_id, user.token);
        console.log('Bid History Response:', response);
        const data = Array.isArray(response) ? response : [];
        setBidHistory(data);
        setFilteredBids(data);
      } catch (error) {
        console.error('Error fetching bid history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [user, navigate]);

  useEffect(() => {
    const filtered = bidHistory.filter((bid) => {
      const matchText = (key) =>
        bid[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

     const withinDateRange = () => {
        const bidDateOnly = bid.pickup_date?.split(' at ')[0]; // Get "Tuesday, 17 Jun 2025"
        const bidDate = bidDateOnly ? new Date(bidDateOnly) : null;

        const from = filters.pickup_date_from ? new Date(filters.pickup_date_from) : null;
        const to = filters.pickup_date_to ? new Date(filters.pickup_date_to) : null;

        if (!bidDate) return false;
        if (from && bidDate < from) return false;
        if (to && bidDate > to) return false;

        return true;
      };


      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        (!filters.biding_amount || matchText('biding_amount')) &&
        (!filters.from_address || matchText('from_address')) &&
        (!filters.to_address || matchText('to_address')) &&
        withinDateRange()
      );
    });

    setFilteredBids(filtered);
  }, [filters, bidHistory]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <Header />
      
      <div className="dashboard-layout mx-5 mt-5">
        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <div className="w-full">
            <div className="w-full">
              <JobsTabs activeTab="bid" user={user} />
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-5">
              <input
                type="text"
                name="booking_ref_id"
                value={filters.booking_ref_id}
                onChange={handleFilterChange}
                placeholder="Booking Ref"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <input
                type="text"
                name="biding_amount"
                value={filters.biding_amount}
                onChange={handleFilterChange}
                placeholder="Bid Amount"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <input
                type="date"
                name="pickup_date_from"
                value={filters.pickup_date_from}
                onChange={handleFilterChange}
                placeholder="From Date"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <input
                type="date"
                name="pickup_date_to"
                value={filters.pickup_date_to}
                onChange={handleFilterChange}
                placeholder="To Date"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <input
                type="text"
                name="from_address"
                value={filters.from_address}
                onChange={handleFilterChange}
                placeholder="From Address"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <input
                type="text"
                name="to_address"
                value={filters.to_address}
                onChange={handleFilterChange}
                placeholder="To Address"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 items-stretch">
              {filteredBids.length > 0 ? (
                filteredBids.map((bid, idx) => (
                  <div
                    key={bid.id || idx}
                    className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full justify-between"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Jewels Airport Transfers</h3>
                      <span className="text-sm text-green-600 font-medium">Bid</span>
                    </div>
                    <div className="mb-3">
                     
                      <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                        <i className="fas fa-receipt text-gray-500"></i> {bid.booking_ref_id}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-map-marker-alt text-blue-500"></i> Pickup:
                        </span>
                        <span className="text-right">{bid.from_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-map-pin text-red-500"></i> DropOff:
                        </span>
                        <span className="text-right">{bid.to_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-road text-yellow-500"></i> Distance:
                        </span>
                        <span className="text-right">{bid.distance ? `${bid.distance} miles Approx` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-calendar-alt text-blue-400"></i> Journey Date:
                        </span>
                        <span className="text-right">{bid.pickup_date?.split(' at ')[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-clock text-purple-500"></i> Journey Time:
                        </span>
                        <span className="text-right">{bid.pickup_date?.split(' at ')[1]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-pound-sign text-green-600"></i> Bid Amount:
                        </span>
                        <span className="text-right font-bold text-green-700">£{bid.biding_amount}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                  <p>No matching bid history found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BidHistory;
