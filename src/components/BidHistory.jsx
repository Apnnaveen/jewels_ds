import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { bid_history, getAllCars, bidJob, withdrawJob } from '../api';
import Loading from './Loading/Loading';
import { DateTime } from 'luxon';

import Header from './MainHeader/Header';


const BidHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('bid');
  const [bidHistory, setBidHistory] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [quote, setQuote] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reaction, setReaction] = useState(false); // <-- add this if setReaction is used

  const [filters, setFilters] = useState({
  booking_ref_id: '',
  biding_amount: '',
  from_address: '',
  to_address: '',
  pickup_date: '',      
  car_id: '',           
});
  
  const handleUpdateBid = (bid) => {
    setSelectedBid(bid);
    setQuote(bid.biding_amount || '');
    setShowModal(true);
    setIsChecked(false);
  };
   const handleSubmitUpdateBid = async () => {
    setActionLoading(true);
    if (!selectedBid || !quote || !isChecked) return;
    setSubmitting(true);
    try {
      await bidJob({
        booking_journey_id: selectedBid.booking_journey_id,
        driver_id: user.driver_id,
        email: user.email,
        fare: quote,
        token: user.token,
      });
      alert('Bid submitted successfully!');
      setShowModal(false);
      setQuote('');
      setIsChecked(false);
      setReaction(true);
      
    } catch (err) {
      setLoading(false);
      alert('Failed to submit bid: ' + err.message);
    }finally {
      setActionLoading(false);
    }
    setSubmitting(false);
  };
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const handleWithdrawJob = async (bid) => {
    if (!window.confirm('Are you sure you want to withdraw this job?')) return;
    setActionLoading(true);
    try {
      await withdrawJob({
        driver_id: user.driver_id,
        booking_journey_id: bid.booking_journey_id,
        token: user.token,
      });
      alert('Job withdrawn successfully!');
      // Optionally refresh bid history
      setBidHistory((prev) => prev.filter((b) => b.booking_journey_id !== bid.booking_journey_id));
      setFilteredBids((prev) => prev.filter((b) => b.booking_journey_id !== bid.booking_journey_id));
    } catch (err) {
      alert('Failed to withdraw job: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };
  useEffect(() => {
  if (reaction) {
    const fetchUpdatedBids = async () => {
      setActionLoading(true);
      try {
        const updatedBids = await bid_history(user.driver_id, user.token);
        setBidHistory(updatedBids);
        setFilteredBids(updatedBids);
      } catch (error) {
        console.error("Error refreshing bid history after update:", error);
      } finally {
        setActionLoading(false);
        setReaction(false); // reset the flag
      }
    };

    fetchUpdatedBids();
  }
}, [reaction, user]);
  useEffect(() => {
    if (!user?.driver_id || !user?.token) {
      navigate('/login');
      return;
    }

    const fetchBidHistory = async () => {
      try {
        
        const [response, carsArray] = await Promise.all([
                                bid_history(user.driver_id, user.token),
                                getAllCars(user.driver_id, user.token)
                            ]);
                            console.log('Bid History Response:', response);
        const data = Array.isArray(response) ? response : [];
        setBidHistory(data);
        setFilteredBids(data);
        setCars(Array.isArray(carsArray) ? carsArray : []);
      } catch (error) {
        console.error('Error fetching bid history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [user, navigate]);

const getCarName = (car_id) => {
        const car = cars.find((c) => c.car_id === car_id);
        return car ? car.car_name : car_id;
    };

 useEffect(() => {
  const filtered = bidHistory.filter((bid) => {
    const matchText = (key) =>
      bid[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

    // Convert pickup_date to 'YYYY-MM-DD' for comparison
    let bidDateISO = '';
    if (bid.pickup_date) {
      const dt = DateTime.fromFormat(bid.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
      bidDateISO = dt.isValid ? dt.toISODate() : '';
    }

    let dateMatch = true;
    if (filters.pickup_date) {
      dateMatch = bidDateISO === filters.pickup_date;
    }

    let carMatch = true;
    if (filters.car_id) {
      carMatch = bid.car_id === filters.car_id;
    }

    return (
      (!filters.booking_ref_id || matchText('booking_ref_id')) &&
      (!filters.biding_amount || matchText('biding_amount')) &&
      (!filters.from_address || matchText('from_address')) &&
      (!filters.to_address || matchText('to_address')) &&
      dateMatch &&
      carMatch
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
       {actionLoading && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-4 rounded-lg shadow-lg">
                <Loading />
            </div>
            </div>
        )}
  
      <div className="dashboard-layout mx-5 mt-5">
        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <div className="w-full">
            <div className="w-full">
              <JobsTabs activeTab="bid" user={user} />
            </div>

            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 px-5 mb-2">
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
            <input
              type="date"
              name="pickup_date"
              value={filters.pickup_date}
              onChange={handleFilterChange}
              placeholder="Journey Date"
              className="p-2 border border-gray-300 rounded-md w-full"
            />
            <select
              name="car_id"
              value={filters.car_id}
              onChange={handleFilterChange}
              className="p-2 border border-gray-300 rounded-md w-full"
            >
              <option value="">All Vehicles</option>
              {cars.map(car => (
                <option key={car.car_id} value={car.car_id}>
                  {car.car_name}
                </option>
              ))}
            </select>
           
           
          </div>

            {/* Card Grid */}
             {loading ? (
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loading />
                </div>
              ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 items-stretch">
              {filteredBids.length > 0 ? (
                filteredBids.map((bid, idx) => (
                  <div
                    key={bid.id || idx}
                    className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full justify-between"
                  >
                    <div className="flex justify-between items-center mb-2">
                        {/* Removed h3 and kept Bid text right-aligned */}
                        <span className="text-sm text-blue-600 font-medium ml-auto"><b>Bid</b></span>
                    </div>
                    <div className="mb-3">
                     <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                         <i className="fas fa-car-side"></i> <b>{getCarName(bid.car_id)}</b>
                       </h4>
                      <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                        <i className="fas fa-receipt text-gray-500"></i> <b>{bid.booking_ref_id}</b>
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      {/* Pickup */}
                        <div>
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                            <i className="fas fa-map-marker-alt text-blue-500"></i> <b>Pickup:</b>
                          </span>
                          <span className="block ml-6"><b>{bid.from_address}</b></span>
                        </div>
                        {/* Waypoints */}
                        {bid.waypoint && bid.waypoint.trim() !== '' && (
                          bid.waypoint.split('|').map((wp, i) =>
                            wp.trim() && (
                              <div key={i}>
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-map-marker-alt text-blue-500"></i>
                                  <b>Waypoint{bid.waypoint.split('|').length > 1 ? ` ${i + 1}` : ''}:</b>
                                </span>
                                <span className="block ml-6"><b>{wp.trim()}</b></span>
                              </div>
                            )
                          )
                        )}
                        {/* DropOff */}
                        <div>
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                            <i className="fas fa-map-pin text-red-500"></i> <b>DropOff:</b>
                          </span>
                          <span className="block ml-6"><b>{bid.to_address}</b></span>
                        </div>
                       
                      
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-calendar-alt text-blue-400"></i> <b>Journey Date:</b>
                        </span>
                        <span className="text-right"><b>{bid.pickup_date?.split(' at ')[0]}</b></span>
                      </div>
                       <div className="flex justify-between">
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-clock text-purple-500"></i> <b>Journey Time:</b>
                          </span>
                          <span className="text-right">
                              <b>{bid.pickup_date
                              ? DateTime.fromFormat(bid.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", {
                                  zone: 'Europe/London'
                                  }).toFormat("hh:mm a")
                              : ''}</b>
                          </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-2 font-medium text-gray-600">
                          <i className="fas fa-pound-sign text-green-600"></i> <b>Bid Amount:</b>
                        </span>
                        <span className="text-right font-bold text-green-700"><b>£{bid.biding_amount}</b></span>
                      </div>
                       <div className="flex gap-2 mt-4">
                          <button
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded"
                            onClick={() => handleWithdrawJob(bid)}
                          >
                            Cancel Bid
                          </button>
                          <button
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded"
                              onClick={() => handleUpdateBid(bid)}
                            >
                              Re-quote
                            </button>
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
            )}
          </div>
          {showModal && selectedBid && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  &times;
                </button>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Update Your Bid</h2>
                  <span className="text-green-600 font-bold">Guide Price: £{selectedBid.guided_price ?? 'N/A'}</span>
                </div>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
                    <span className="font-medium text-gray-700">Journey Date: {selectedBid.pickup_date?.split(' at ')[0]}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fas fa-clock mr-2 text-blue-600"></i>
                    <span className="font-medium text-gray-700">Journey Time: {selectedBid.pickup_date?.split(' at ')[1]}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <input
                    type="number"
                    placeholder="£ New Quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 mb-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-700">
                    By updating your bid, you accept the Jewels Airport Transfers{' '}
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-500">
                      terms and conditions
                    </a>
                  </span>
                </div>
                <button
                  className={`w-full p-3 rounded text-white font-medium ${!isChecked || !quote ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  disabled={!isChecked || !quote}
                  onClick={handleSubmitUpdateBid}
                >
                  {submitting ? 'Updating...' : 'Update Bid'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BidHistory;
