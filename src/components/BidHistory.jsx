import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { bid_history, getAllCars, bidJob, withdrawJob, checkBidJobs, checkBidForCurrentDriver, fetchJourneyDetails, checkUserToken } from '../api';
import Loading from './Loading/Loading';
import BidCardSkeleton from './Loading/BidCardSkeleton';
import { DateTime } from 'luxon';
import Select from 'react-select';
import Header from './MainHeader/Header';
import { useJobsCounts } from './JobsCountsProvider';


const BidHistory = () => {
  const validateUserToken = async () => {
      if (!user?.driver_id || !user?.token) {
          // No user info in localStorage/session
          return;
      }
  
      try {
          const result = await checkUserToken(user.driver_id, user.token);
  
          // Check if token is missing in database
          if (!result?.token) {
              alert('Your session has expired. Please log in again.');
              localStorage.removeItem('user');
              navigate('/');
          }
          // Optional: match check (only if DB token is not empty)
          else if (result.token !== user.token) {
              alert('Your session has expired. Please log in again.');
              localStorage.removeItem('user');
              navigate('/');
          }
      } catch (error) {
          // Only show alert if this is a real API/network failure, not on first load
          console.error('Token validation failed:', error);
      }
  };
   // auto-refresh  every 30 mins
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 1800000); // 30 mins
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
      const timer = setTimeout(() => {
          validateUserToken();  // 🔒 run after slight delay
      }, 2000); // wait 2 seconds after mount
  
      return () => clearTimeout(timer);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('bid');
  const [bidHistory, setBidHistory] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cars, setCars] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [quote, setQuote] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reaction, setReaction] = useState(false);
  const { refreshCounts } = useJobsCounts();
  const [disabledButton, setDisabledButton] = useState(new Set());
  const [page, setPage] = useState(1);
  const [perPage] = useState(5); // can adjust
  const [pagination, setPagination] = useState(null);


  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    pickup_date: '',
    car_id: [],
  });
  const clearFilters = () => {
    setFilters({
      booking_ref_id: '',
      from_address: '',
      to_address: '',
      waypoint: '',
      pickup_date: '',
      passengers: '',
      luggage: '',
      distance: '',
      car_id: [],
      bid_expiry: '',
    });
  };
  const tabCounts = {
    bid: filteredBids.length, // Quotation tab

  };
 
  const handleUpdateBid = async (bid) => {
    try {
        const checkToken = await checkUserToken(user.driver_id);

        if (user.token !== checkToken.token) {
            alert('Please use the recently logged-in browser/tab.');
            localStorage.removeItem('user');
            localStorage.removeItem('lastActivity');
            navigate('/');
            return;
        }

    } catch (error) {
            alert('Session expired. Please login again.');
            localStorage.removeItem('user');
            localStorage.removeItem('lastActivity');
            navigate('/');
            return;
        }
    setDisabledButton(prev => new Set(prev).add(bid.booking_journey_id));
    setDetailsError('');
    setShowModal(true);
    setSelectedBid(bid);
    setIsChecked(true);
    setLoadingDetails(true);
    ;

    try {
      const details = await fetchJourneyDetails(bid.booking_journey_id, user.driver_id, user.token);

      setSelectedBid(prev => ({ ...prev, ...details[0] }));
      refreshCounts();
    } catch (err) {
      setDetailsError('Failed to load details.');
    } finally {
      setDisabledButton(prev => {
        const newSet = new Set(prev);
        newSet.delete(bid.booking_journey_id);
        return newSet;
      });
    }
    setLoadingDetails(false);

  };
  const handleSubmitUpdateBid = async () => {
    setDisabledButton(prev => new Set(prev).add(selectedBid.booking_journey_id));
    setActionLoading(true);
    if (!selectedBid || !quote || !isChecked) return;
    setSubmitting(true);
    try {
      const checkResult = await checkBidJobs(selectedBid.booking_journey_id, user.token);
      

      if (checkResult) {
        const { assigned, bid_timer } = checkResult;

        // 1. Check if job is already assigned
        if (assigned === true || assigned === 1) {
          alert('This job has already been assigned to another driver.');
          refreshCounts();
          setShowModal(false);
          setQuote('');
          setIsChecked(false);
          setReaction(true); // refresh jobs
          setSubmitting(false);
          return;
        }

        // 2. Check if bid has expired
        if (bid_timer && bid_timer.time_left === "bid_expired") {
          alert("You can't quote this booking. The bid has expired.");
          refreshCounts();
          setShowModal(false);
          setQuote('');
          setIsChecked(false);
          setReaction(true); // refresh jobs
          setSubmitting(false);
          return;
        }


      }
      const checkCurrentResult = await checkBidForCurrentDriver(selectedBid.booking_journey_id, user.driver_id, user.token);
      if (checkCurrentResult?.assigned === 1) {
        alert('You cannot change the bid. Availability has already been sent. Please check the Availability tab.');
        refreshCounts();
        setShowModal(false);
        setQuote('');
        setIsChecked(false);
        setReaction(true); // refresh job
        setSubmitting(false);
        return;
      }
      const driverIdToUse =
        selectedBid.customer_type === "subs"
          ? selectedBid.driver_id
          : user.driver_id;

      const emailToUse =
        selectedBid.customer_type === "subs"
          ? selectedBid.email
          : user.email;


      await bidJob({
        booking_journey_id: selectedBid.booking_journey_id,
        driver_id: driverIdToUse,
        email: emailToUse,
        fare: quote,
        token: user.token,
      });
      alert('Bid submitted successfully!');
      refreshCounts();
      setShowModal(false);
      setQuote('');
      setIsChecked(false);
      setReaction(true);
    } catch (err) {
      setLoading(false);
      alert('Failed to submit bid: ' + err.message);
    } finally {
      setDisabledButton(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedBid.booking_journey_id);
        return newSet;
      });
      setActionLoading(false);
    }
    setSubmitting(false);
  };
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const handleWithdrawJob = async (bid) => {
    try {
        const checkToken = await checkUserToken(user.driver_id);

        if (user.token !== checkToken.token) {
            alert('Please use the recently logged-in browser/tab.');
            localStorage.removeItem('user');
            localStorage.removeItem('lastActivity');
            navigate('/');
            return;
        }

    } catch (error) {
            alert('Session expired. Please login again.');
            localStorage.removeItem('user');
            localStorage.removeItem('lastActivity');
            navigate('/');
            return;
        }
    setDisabledButton(prev => new Set(prev).add(bid.booking_journey_id));

    if (!window.confirm('Are you sure you want to withdraw this job?')) return;

    setActionLoading(true);

    try {
      // 👇 if subs then use bid.driver_id else use logged-in user.driver_id
      const driverIdToUse =
        bid.customer_type === "subs" ? bid.driver_id : user.driver_id;

      await withdrawJob({
        biding_amount: bid.biding_amount,
        driver_id: driverIdToUse,
        booking_journey_id: bid.booking_journey_id,
        token: user.token,
      });

      alert('Job withdrawn successfully!');
      refreshCounts();

      // Remove withdrawn job from state
      setBidHistory((prev) =>
        prev.filter((b) => b.booking_journey_id !== bid.booking_journey_id)
      );
      setFilteredBids((prev) =>
        prev.filter((b) => b.booking_journey_id !== bid.booking_journey_id)
      );
    } catch (err) {
      alert('Failed to withdraw job: ' + err.message);
    } finally {
      setDisabledButton((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bid.booking_journey_id);
        return newSet;
      });
      setActionLoading(false);
    }
  };

  const fetchBidHistoryData = async ({ isReaction = false } = {}) => {
    if (!user?.driver_id || !user?.token) return;

    if (isReaction) setActionLoading(true);
    else setLoading(true);

    try {
      const params = {
        page,
        per_page: perPage,
        booking_ref_id: filters.booking_ref_id, // NOT ref_filter
        pickup_date: filters.pickup_date,       // NOT date
        car_id: filters.car_id,                 // array supported
        from_address: filters.from_address,
        to_address: filters.to_address,
      };


      const [response, carsArray] = await Promise.all([
        bid_history(user.driver_id, user.token, params),
        getAllCars(user.driver_id, user.token)
      ]);
      
      // Backend should now return { data: [...], pagination: {...} }
      const data = response.data || [];
      const sortedData = [...data].sort((a, b) => {
        const dateA = DateTime.fromFormat(a.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        const dateB = DateTime.fromFormat(b.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        if (!dateA.isValid) return 1;
        if (!dateB.isValid) return -1;
        return dateA.toMillis() - dateB.toMillis();
      });

      setBidHistory(sortedData);
      setFilteredBids(sortedData);
      setPagination(response.pagination || null);
      setCars(Array.isArray(carsArray) ? carsArray : []);
      refreshCounts();
    } catch (error) {
      console.error('Error fetching bid history:', error);
    } finally {
      if (isReaction) setActionLoading(false);
      else setLoading(false);
    }
  };
  useEffect(() => {
    if (!user?.driver_id || !user?.token) {
      navigate('/login');
      return;
    }
    fetchBidHistoryData();
  }, [user, navigate, page, filters]);
  useEffect(() => {
    if (reaction) {
      fetchBidHistoryData({ isReaction: true });
      setReaction(false);
    }
  }, [reaction]);


  const userVehicleIds = user.vehicle_id.split(',').map(id => id.trim());
  const filteredCars = cars.filter(car => userVehicleIds.includes(car.car_id));
  const vehicleOptions = filteredCars.map(car => ({
    label: car.car_name,
    value: car.car_id,
  }));
  const getCarName = (car_id) => {
    const car = cars.find((c) => c.car_id === car_id);
    return car ? car.car_name : car_id;
  };

  useEffect(() => {
    const filtered = bidHistory.filter((bid) => {
      const matchText = (key) =>
        bid[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      const matchPostcode = (key) => {
        const input = filters[key]?.toLowerCase().trim();
        if (!input) return true;

        const value = bid[key]?.toString().toLowerCase();
        const postcodeMatch = value.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);

        if (postcodeMatch) {
          const fullPostcode = postcodeMatch[0].replace(/\s+/g, '').toLowerCase();
          const prefix = fullPostcode.slice(0, input.length);
          return prefix === input;
        }

        return false;
      };

      // Convert pickup_date to ISO
      let bidDateISO = '';
      if (bid.pickup_date) {
        const dt = DateTime.fromFormat(bid.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        bidDateISO = dt.isValid ? dt.toISODate() : '';
      }

      const dateMatch = !filters.pickup_date || bidDateISO === filters.pickup_date;
      const carMatch = !filters.car_id || filters.car_id.length === 0 || filters.car_id.includes(bid.car_id);

      const fromPostcodeMatch = matchPostcode('from_address');
      const toPostcodeMatch = matchPostcode('to_address');

      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        (!filters.biding_amount || matchText('biding_amount')) &&
        fromPostcodeMatch &&
        toPostcodeMatch &&
        dateMatch &&
        carMatch
      );
    });

    setFilteredBids(filtered);
  }, [filters, bidHistory]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // RESET PAGE whenever filter changes
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-5 mb-2">
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
                min={new Date().toISOString().split('T')[0]}
                placeholder="Journey Date"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <Select
                isMulti
                name="car_id"
                options={vehicleOptions}
                value={vehicleOptions.filter(opt => filters.car_id.includes(opt.value))}
                onChange={selectedOptions => {
                  const selectedValues = selectedOptions.map(option => option.value);
                  setFilters(prev => ({ ...prev, car_id: selectedValues }));
                }}
                className="w-full"
                placeholder="Select Vehicle(s)"
              />
              <input
                type="button"
                value="Clear"
                onClick={clearFilters}
                className="p-2 border border-gray-300 rounded-md w-full cursor-pointer text-center bg-gray-100 hover:bg-red-100 text-red-500 font-semibold"
              />

            </div>

            {/* Card Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {(Array.from({ length: 6 })).map((_, i) => (
                  <BidCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 items-stretch">
                {filteredBids.length > 0 ? (
                  filteredBids.map((bid, idx) => (
                    <div
                      key={bid.id || idx}
                      className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full"
                    >
                      {/* Top - Bid label */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-blue-600 font-medium ml-auto"><b>Bid</b></span>
                      </div>

                      {/* Middle - All journey details */}
                      <div className="flex-1 flex flex-col space-y-1 text-sm text-gray-700">
                        <div className="mb-2">
                          <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                            <i className="fas fa-car-side"></i> <b>{getCarName(bid.car_id)}</b>
                          </h4>

                          {/* Booking Ref + Customer Type in same row */}
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <i className="fas fa-receipt text-gray-500"></i> <b>{bid.booking_ref_id}</b>
                            </p>

                            {bid.customer_type === "subs" && user.user_type === "supplier" && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold ml-2">Sub</span>
                            )}
                          </div>
                        </div>


                        {/* Pickup */}
                        <div>
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                            <i className="fas fa-map-marker-alt text-blue-500"></i> <b>Pickup:</b>
                          </span>
                          <span className="block ml-6"><b>{bid.from_address}</b></span>
                        </div>

                        {/* Waypoints */}
                        {bid.waypoint?.trim() !== '' &&
                          bid.waypoint?.split('|').map((wp, i) =>
                            wp.trim() && (
                              <div key={i}>
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-map-marker-alt text-blue-500"></i>
                                  <b>Waypoint{bid.waypoint?.split('|').length > 1 ? ` ${i + 1}` : ''}:</b>
                                </span>
                                <span className="block ml-6"><b>{wp.trim()}</b></span>
                              </div>
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

                        {bid.flight_no?.trim() !== '' && (
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-plane text-indigo-500"></i> <b>Flight No:</b>
                            </span>
                            <span className="text-right"><b>{bid.flight_no}</b></span>
                          </div>
                        )}

                        {bid.arrive_from?.trim() !== '' && (
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-globe-europe text-teal-500"></i> <b>Arrive From:</b>
                            </span>
                            <span className="text-right"><b>{bid.arrive_from}</b></span>
                          </div>
                        )}


                        {bid.driver_supplier_remarks?.trim() !== '' && (
                          <div>
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-id-card text-blue-500"></i><b> Driver Instructions:</b>
                            </span>
                            <div className="ml-6" dangerouslySetInnerHTML={{ __html: bid.driver_supplier_remarks }} />
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                            <i className="fas fa-pound-sign text-green-600"></i> <b>Bid Amount:</b>
                          </span>
                          <span className="text-right font-bold text-green-700"><b>£{bid.biding_amount}</b></span>
                        </div>
                      </div>

                      {/* Bottom fixed button group */}
                      <div className="mt-auto pt-3 flex gap-2">
                        <button
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded"
                          onClick={() => handleWithdrawJob(bid)}
                          disabled={disabledButton.has(bid.booking_journey_id)}
                        >
                          Cancel Bid
                        </button>
                        <button
                          className={`flex-1 text-sm font-medium py-2 px-4 rounded 
                          ${bid.bid_timer?.time_left === "bid_expired"
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                          onClick={() => handleUpdateBid(bid)}
                          disabled={bid.bid_timer?.time_left === "bid_expired"}
                        >
                          Re-quote
                        </button>

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
          {pagination && (
            <div className="flex justify-center gap-4 my-4">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button
                disabled={pagination.current_page === pagination.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
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

                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center h-40">
                    <Loading />
                    <span className="mt-4 text-gray-600">Loading details...</span>
                  </div>
                ) : detailsError ? (
                  <div className="text-red-600 text-center">{detailsError}</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">Update Your Bid</h2>
                      <span className="text-green-600 font-bold">
                        Guide Price: £{selectedBid.guidedprice ?? 'N/A'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
                        <span className="font-medium text-gray-700">
                          Journey Date: {selectedBid.pickup_date?.split(' at ')[0]}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-clock mr-2 text-blue-600"></i>
                        <span className="font-medium text-gray-700">
                          Journey Time: {selectedBid.pickup_date?.split(' at ')[1]}
                        </span>
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
                        <a
                          href="https://jat-uk.com/instructions-and-terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500"
                        >
                          terms and conditions
                        </a>
                      </span>
                    </div>

                    <button
                      className={`w-full p-3 rounded text-white font-medium ${!isChecked || !quote
                          ? 'bg-gray-400'
                          : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      disabled={
                        !isChecked ||
                        !quote ||
                        disabledButton.has(selectedBid.booking_journey_id)
                      }
                      onClick={handleSubmitUpdateBid}
                    >
                      {submitting ? 'Updating...' : 'Update Bid'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default BidHistory;
