import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import Loading from './Loading/Loading';
import ScheduledJobSkeleton from './Loading/ScheduledJobSkeleton';
import Header from './MainHeader/Header';
import { scheduled_journey_details, getAvailabilityExpiry, confirmAvailability, declineJob, getAllCars, checkBidJobs, getJourneysOnDate, updateUserSeenScheduled } from '../api';
import { DateTime } from 'luxon';
import Select from 'react-select';
import { useJobsCounts } from './JobsCountsProvider';

const ScheduledJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const [page, setPage] = useState(1);
  const [perPage] = useState(5); 
  const [pagination, setPagination] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('scheduled');
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState([]);
  const [reaction, setReaction] = useState(false);
  const { refreshCounts } = useJobsCounts();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [sameDayJobs, setSameDayJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [disabledButton, setDisabledButton] = useState(new Set());

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
    scheduled: filteredJobs.length,
  };
  useEffect(() => {
    const fetchCars = async () => {
      if (user?.driver_id && user?.token) {
        try {
          const carsArray = await getAllCars(user.driver_id, user.token);

          setCars(Array.isArray(carsArray) ? carsArray : []);
        } catch {
          setCars([]);
        }
      }
    };
    fetchCars();
  }, [user]);

  const getCarName = (car_id) => {
    const car = cars.find((c) => c.car_id === car_id);

    return car ? car.car_name : car_id;
  };

  const handleAccept = async (job, skipConflictCheck = false) => {
    setDisabledButton(prev => new Set(prev).add(job.booking_journey_id));

    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }

      // Fetch expiry from backend for this driver & journey
      let expiryTime = job.availability_expired_time;
      if (!expiryTime) {
        expiryTime = await getAvailabilityExpiry(job.booking_journey_id, user.driver_id, user.token);
      }

      if (expiryTime) {
        const expiredDt = DateTime.fromFormat(expiryTime, "yyyy-MM-dd HH:mm:ss", { zone: "Europe/London" });
        const now = DateTime.now().setZone("Europe/London");
        console.log(expiredDt);

        if (expiredDt.isValid && expiredDt < now) {
          alert("This job is expired and cannot be accepted.");
          setDisabledButton(prev => {
            const newSet = new Set(prev);
            newSet.delete(job.booking_journey_id);
            return newSet;
          });
          setReaction(true);
          return;
        }
      }
      // Get date in YYYY-MM-DD
      const dt = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });

      const jobDate = dt.isValid ? dt.toISODate() : '';
      if (!skipConflictCheck && jobDate) {
        const conflicts = await getJourneysOnDate(user.driver_id, jobDate, user.token);
        console.log(conflicts);

        // Exclude the current job if present
        const filtered = (conflicts || []).filter(j => j.booking_journey_id !== job.booking_journey_id);
        if (filtered.length > 0) {
          setSameDayJobs(filtered);
          setSelectedJob(job);
          setShowConflictModal(true);
          return;
        }
      }
      const checkResult = await checkBidJobs(job.booking_journey_id, user.token);
      if (checkResult && (checkResult.assigned === true || checkResult.assigned === 1)) {
        alert('This job has already been assigned to another driver.');
        refreshCounts();
        window.location.reload();
        setReaction(true);
        return;
      }
      setActionLoading(true);
      const driverIdToUse =
        job.customer_type === "subs"
          ? job.driver_id
          : user.driver_id;
      await confirmAvailability({
        driver_id: driverIdToUse,
        booking_journey_id: job.booking_journey_id,
        status: 1,
        token: user.token,
      });
      alert('Availability confirmed!');
      setReaction(true);
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to confirm availability');
      setReaction(true);
    } finally {
      setDisabledButton(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.booking_journey_id);
        return newSet;
      });
      setActionLoading(false);
    }
  };

  const handleDecline = async (job) => {
    setDisabledButton(prev => new Set(prev).add(job.booking_journey_id));

    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }
      setActionLoading(true);
      const driverIdToUse =
        job.customer_type === "subs"
          ? job.driver_id
          : user.driver_id;
      await declineJob({
        driver_id: driverIdToUse,
        booking_journey_id: job.booking_journey_id,
        token: user.token,
      });
      alert('Job declined!');
      setReaction(true);
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to decline job');
      setReaction(true);
    } finally {
      setDisabledButton(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.booking_journey_id);
        return newSet;
      });
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchScheduledJobs = async () => {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
         setPageLoading(true);
        // Prepare params only if not a reaction refresh
        const params = !reaction
          ? {
            page,
            per_page: perPage,
            ref_filter: filters.booking_ref_id,
            date: filters.pickup_date,
            vehicle: filters.car_id[0] || '',
            from_address: filters.from_address,
            to_address: filters.to_address,
          }
          : undefined;

        const response = await scheduled_journey_details(user.driver_id, user.token, params);

        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (!Array.isArray(jobs)) throw new Error('Invalid job data received.');

        setPagination(response.pagination || null);
        refreshCounts();
        setScheduledJobs(jobs);
        setFilteredJobs(jobs);

        // Only update unseen if not a reaction refresh
        if (!reaction) {
          const seen = JSON.parse(user.user_seen || '[]');
          const newRefs = jobs.map(job => job.booking_journey_id);
          const updatedSeen = [...new Set([...seen, ...newRefs])];

          if (newRefs.length > 0) {
            await updateUserSeenScheduled(user.driver_id, updatedSeen, user.token);
            window.dispatchEvent(new Event('userScheduledSeenUpdated'));
          }
        }
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setPageLoading(false);
        setLoading(false);
        if (reaction) setReaction(false);
      }
    };

    fetchScheduledJobs();
  }, [user, page, filters, reaction]);

  const userVehicleIds = user.vehicle_id.split(',').map(id => id.trim());
  const filteredCars = cars.filter(car => userVehicleIds.includes(car.car_id));
  const vehicleOptions = filteredCars.map(car => ({
    label: car.car_name,
    value: car.car_id,
  }));
  useEffect(() => {
    const filtered = scheduledJobs.filter((job) => {
      const matchText = (key) =>
        job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      const matchPostcode = (key) => {
        const input = filters[key]?.toLowerCase().trim();
        if (!input) return true;

        const value = job[key]?.toString().toLowerCase();
        const postcodeMatch = value.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);

        if (postcodeMatch) {
          const fullPostcode = postcodeMatch[0].replace(/\s+/g, '').toLowerCase();
          const prefix = fullPostcode.slice(0, input.length);
          return prefix === input;
        }

        return false;
      };

      // Convert pickup_date to 'YYYY-MM-DD'
      let jobDateISO = '';
      if (job.pickup_date) {
        const dt = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        jobDateISO = dt.isValid ? dt.toISODate() : '';
      }

      const dateMatch = !filters.pickup_date || jobDateISO === filters.pickup_date;
      const carMatch = !filters.car_id || filters.car_id.length === 0 || filters.car_id.includes(job.car_id);
      const fromPostcodeMatch = matchPostcode('from_address');
      const toPostcodeMatch = matchPostcode('to_address');

      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        fromPostcodeMatch &&
        toPostcodeMatch &&
        (!filters.meet_and_greet || matchText('meet_and_greet')) &&
        (!filters.distance || matchText('distance')) &&
        (!filters.quoted_price || matchText('quoted_price')) &&
        dateMatch &&
        carMatch
      );
    });

    setFilteredJobs(filtered);
  }, [filters, scheduledJobs]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // reset page whenever filter changes
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
              <JobsTabs activeTab="scheduled" user={user} />
            </div>

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
                  setPage(1); // reset page whenever vehicle filter changes
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
            <div className="jobs-content">
              {loading || pageLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {(Array.from({ length: filteredJobs?.length || 6 })).map((_, i) => (
                    <ScheduledJobSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <p className="error">{error}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length === 0 ? (
                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                      <p>No matching jobs found.</p>
                    </div>
                  ) : (
                    filteredJobs.map((job, index) => (
                      <div
                        key={job.id || index}
                        className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full"
                      >

                        {/* Top section */}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium ml-auto"><b>Scheduled</b></span>
                        </div>

                        {/* Main content (top & middle) */}
                        <div className="flex-1 flex flex-col space-y-1 text-sm text-gray-700">
                          <div className="mb-2 flex items-center justify-between">
                            {/* Car Name */}
                            <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                              <i className="fas fa-car-side"></i> <b>{getCarName(job.car_id)}</b>
                            </h4>

                            {/* 👉 If subs, show Sub tag */}
                            {job.customer_type === "subs" && user.user_type === "supplier" && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold ml-2">
                                Sub
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <i className="fas fa-receipt text-gray-500"></i> <b>{job.booking_ref_id}</b>
                          </p>


                          {/* Pickup */}
                          <div>
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-marker-alt text-blue-500"></i><b> Pickup:</b>
                            </span>
                            <span className="block ml-6"><b>{job.from_address}</b></span>
                          </div>

                          {/* Waypoints */}
                          {job.waypoint?.trim() !== '' &&
                            job.waypoint.split('|').map((wp, i) =>
                              wp.trim() && (
                                <div key={i}>
                                  <span className="flex items-center gap-2 font-medium text-gray-600">
                                    <i className="fas fa-map-marker-alt text-blue-500"></i>
                                    <b>Waypoint{job.waypoint.split('|').length > 1 ? ` ${i + 1}` : ''}:</b>
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
                            <span className="block ml-6"><b>{job.to_address}</b></span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-road text-yellow-500"></i> <b>Distance:</b>
                            </span>
                            <span className="text-right"><b>{job.distance ? `${job.distance}` : 'N/A'}</b></span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-calendar-alt text-blue-400"></i> <b>Journey Date:</b>
                            </span>
                            <span className="text-right"><b>{job.pickup_date?.split(' at ')[0]}</b></span>
                          </div>

                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-clock text-purple-500"></i> <b>Journey Time:</b>
                            </span>
                            <span className="text-right">
                              <b>{job.pickup_date
                                ? DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' })
                                  .toFormat("hh:mm a")
                                : ''}</b>
                            </span>
                          </div>

                          {job.flight_no?.trim() !== '' && (
                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-plane text-indigo-500"></i> <b>Flight No:</b>
                              </span>
                              <span className="text-right"><b>{job.flight_no}</b></span>
                            </div>
                          )}

                          {job.arrive_from?.trim() !== '' && (
                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-globe-europe text-teal-500"></i> <b>Arrive From:</b>
                              </span>
                              <span className="text-right"><b>{job.arrive_from}</b></span>
                            </div>
                          )}

                          {job.driver_supplier_remarks?.trim() !== '' && (
                            <div>
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-id-card text-blue-500"></i><b> Driver Instructions:</b>
                              </span>
                              <div className="ml-6" dangerouslySetInnerHTML={{ __html: job.driver_supplier_remarks }} />
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-pound-sign text-green-500"></i> <b>Price:</b>
                            </span>
                            <span className="text-right"><b>£{job.biding_amount || '10.00'}</b></span>
                          </div>
                        </div>

                        {/* Bottom pinned section */}
                        <div className="mt-auto pt-3">
                          {job.car_info && (
                            <div className="text-xs text-gray-500 border-t pt-2 mb-2">
                              <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                <i className="fas fa-info-circle text-blue-500 "></i> {job.car_info}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded"
                              onClick={() => handleAccept(job)}
                              disabled={disabledButton.has(job.booking_journey_id)}
                            >
                              Accept
                            </button>
                            <button
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded"
                              onClick={() => handleDecline(job)}
                              disabled={disabledButton.has(job.booking_journey_id)}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>

                    ))
                  )}
                </div>
              )}
            </div>
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
          {showConflictModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white w-full max-w-6xl p-6 rounded-lg shadow-lg relative">
                <button
                  onClick={() => setShowConflictModal(false)}
                  className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold"
                  aria-label="Close modal"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
                  You already have scheduled journeys for this date!
                </h2>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700 uppercase">
                      <tr>
                        <th className="px-4 py-2 border">Ref</th>
                        <th className="px-4 py-2 border">Pickup</th>
                        <th className="px-4 py-2 border">Dropoff</th>
                        <th className="px-4 py-2 border">Journey Date</th>
                        <th className="px-4 py-2 border">Journey Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...sameDayJobs]
                        .sort((a, b) => new Date(a.pickup_date) - new Date(b.pickup_date)) // Sort by pickup time ascending
                        .map((j, idx) => {
                          const pickupDate = new Date(j.pickup_date);
                          const options = {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          };
                          const date = pickupDate.toLocaleDateString('en-US', options);
                          const time = pickupDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <tr key={j.booking_journey_id || idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border">{j.booking_sub_id}</td>
                              <td className="px-4 py-2 border">{j.from_address}</td>
                              <td className="px-4 py-2 border">{j.to_address}</td>
                              <td className="px-4 py-2 border">{date}</td>
                              <td className="px-4 py-2 border">{time}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowConflictModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowConflictModal(false);
                      await handleAccept(selectedJob, true); // skip conflict check
                    }}
                    disabled={disabledButton.has(selectedJob?.booking_journey_id)}

                    className="px-4 py-2 bg-green-600 text-white border border-green-600 rounded hover:bg-green-700 transition"
                  >
                    Accept Anyway
                  </button>
                </div>
              </div>
            </div>
          )}





        </div>
      </div>
    </>
  );
};

export default ScheduledJobs;
