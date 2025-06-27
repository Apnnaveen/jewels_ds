import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import Loading from './Loading/Loading';
import Header from './MainHeader/Header';
import { scheduled_journey_details, confirmAvailability, declineJob, getAllCars, checkBidJobs } from '../api';
import { DateTime } from 'luxon';

const ScheduledJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('scheduled');
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState([]);
  const [reaction, setReaction] = useState(false);


  const [filters, setFilters] = useState({
    vehicle_type: '',
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    meet_and_greet: '',
    distance: '',
    quoted_price: '',
    pickup_date: '',
    car_id: '',
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
      car_id: '',
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

  const handleAccept = async (job) => {
    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }
      const checkResult = await checkBidJobs(job.booking_journey_id, user.token);
      if (checkResult && (checkResult.assigned === true || checkResult.assigned === 1)) {
        alert('This job has already been assigned to another driver.');
        window.location.reload();
        setReaction(true);
        return;
      }
      setActionLoading(true);
      await confirmAvailability({
        driver_id: user.driver_id,
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
      setActionLoading(false);
    }
  };

  const handleDecline = async (job) => {
    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }
      setActionLoading(true);
      await declineJob({
        driver_id: user.driver_id,
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
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchScheduledJobs = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        const response = await scheduled_journey_details(user.driver_id, user.token);
        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        if (!Array.isArray(jobs)) {
          throw new Error('Invalid job data received.');
        }
        setScheduledJobs(jobs);
        setFilteredJobs(jobs);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchScheduledJobs();
  }, [user]);

  // Refresh jobs after accept/decline
  useEffect(() => {
    if (reaction) {
      const fetchScheduledJobs = async () => {
        try {
          if (!user?.driver_id || !user?.token) {
            setError('User not authenticated');
            return;
          }
          const response = await scheduled_journey_details(user.driver_id, user.token);
          const jobs = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [];
          if (!Array.isArray(jobs)) {
            throw new Error('Invalid job data received.');
          }
          setScheduledJobs(jobs);
          setFilteredJobs(jobs);
        } catch (err) {
          setError(err.message || 'Something went wrong');
        } finally {
          setLoading(false);
          setReaction(false);
        }
      };
      fetchScheduledJobs();
    }
  }, [reaction, user]);

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
    const carMatch = !filters.car_id || job.car_id === filters.car_id;
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
              <JobsTabs activeTab="scheduled" user={user} tabCounts={tabCounts} />
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
                {cars
                  .map(car => (
                    <option key={car.car_id} value={car.car_id}>
                      {car.car_name}
                    </option>
                  ))}
              </select>
              <input
                type="button"
                value="Clear"
                onClick={clearFilters}
                className="p-2 border border-gray-300 rounded-md w-full cursor-pointer text-center bg-gray-100 hover:bg-red-100 text-red-500 font-semibold"
              />
            </div>
            <div className="jobs-content">
              {loading ? (
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loading />
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
                      <div key={job.id || index} className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium ml-auto"><b>Scheduled</b></span>
                        </div>
                        <div className="mb-3">
                          <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                            <i className="fas fa-car-side"></i> <b>{getCarName(job.car_id)}</b>
                          </h4>
                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <i className="fas fa-receipt text-gray-500"></i> <b>{job.booking_ref_id}</b>
                          </p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          {/* Pickup */}
                          <div>
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-marker-alt text-blue-500"></i><b> Pickup:</b>
                            </span>
                            <span className="block ml-6"><b>{job.from_address}</b></span>
                          </div>
                          {/* Waypoints */}
                          {job.waypoint && job.waypoint.trim() !== '' && (
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
                                ? DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", {
                                  zone: 'Europe/London'
                                }).toFormat("hh:mm a")
                                : ''}</b>
                            </span>
                          </div>
                          {job.driver_supplier_remarks && job.driver_supplier_remarks.trim() !== '' && (
                            <div>
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-id-card text-blue-500"></i><b> Driver Instructions:</b>
                              </span>
                              <span className="block ml-6"><b>{job.driver_supplier_remarks}</b></span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-pound-sign text-green-500"></i> <b>Price:</b>
                            </span>
                            <span className="text-right"><b>£{job.biding_amount || '10.00'}</b></span>
                          </div>
                        </div>
                        {job.car_info && (
                          <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                            <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                              <i className="fas fa-info-circle text-blue-500 "></i> {job.car_info}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <button
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded"
                            onClick={() => handleAccept(job)}
                          >
                            Accept
                          </button>
                          <button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded"
                            onClick={() => handleDecline(job)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduledJobs;
