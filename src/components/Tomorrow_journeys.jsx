import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { tomorrow_journeys, getAllCars, acknowledgeStatus } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
import { DateTime } from 'luxon';


const TomorrowJourneys = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tomorrowJobs, setTomorrowJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [cars, setCars] = useState([]);
  const [ackLoading, setAckLoading] = useState({});
  // Only 4 filters: refid, from, to, date

  const [filters, setFilters] = useState({
    booking_sub_id: '',
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
  const clearFilters = () => {
    setFilters({
      booking_sub_id: '',
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
    tomorrow: filteredJobs.length, // Quotation tab
  
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }
        const [response, carsArray] = await Promise.all([
          tomorrow_journeys(user.driver_id, user.token),
          getAllCars(user.driver_id, user.token)
        ]);
        console.log('Tomorrow Journeys Response:', response);
        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];
        setTomorrowJobs(jobs);
        setFilteredJobs(jobs);
        setCars(Array.isArray(carsArray) ? carsArray : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getCarName = (car_id) => {
    const car = cars.find((c) => c.car_id === car_id);
    return car ? car.car_name : car_id;
  };
  const handleAcknowledge = async (job) => {
    setActionLoading(true); // Show global loading
    setAckLoading((prev) => ({ ...prev, [job.booking_journey_id]: true }));
    try {
      await acknowledgeStatus({
        driver_id: user.driver_id,
        booking_journey_id: job.booking_journey_id,
        acknowledge_status: 1,
        token: user.token,
      });
      // Update local state to reflect acknowledgment
      setTomorrowJobs((prev) =>
        prev.map((j) =>
          j.booking_journey_id === job.booking_journey_id
            ? { ...j, acknowledge_status: 1 }
            : j
        )
      );
      setFilteredJobs((prev) =>
        prev.map((j) =>
          j.booking_journey_id === job.booking_journey_id
            ? { ...j, acknowledge_status: 1 }
            : j
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to acknowledge job');
    } finally {
      setAckLoading((prev) => ({ ...prev, [job.booking_journey_id]: false }));
      setActionLoading(false); // Hide global loading
    }
  };
  useEffect(() => {
    const filtered = tomorrowJobs
      .filter((job) => {
        const matchText = (key) =>
          job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

        // Convert pickup_date to 'YYYY-MM-DD' for comparison
        let jobDateISO = '';
        if (job.pickup_date) {
          const dt = DateTime.fromFormat(job.pickup_date, "yyyy-MM-dd HH:mm:ss", { zone: 'Europe/London' });
          jobDateISO = dt.isValid ? dt.toISODate() : '';
        }

        let dateMatch = true;
        if (filters.pickup_date) {
          dateMatch = jobDateISO === filters.pickup_date;
        }

        let carMatch = true;
        if (filters.car_id) {
          carMatch = job.car_id === filters.car_id;
        }

        return (
          (!filters.booking_sub_id || matchText('booking_sub_id')) &&
          (!filters.from_address || matchText('from_address')) &&
          (!filters.to_address || matchText('to_address')) &&
          (!filters.waypoint || matchText('waypoint')) &&
          (!filters.passengers || matchText('passengers')) &&
          (!filters.luggage || matchText('luggage')) &&
          (!filters.distance || matchText('distance')) &&
          (!filters.bid_expiry || matchText('bid_expiry')) &&
          dateMatch &&
          carMatch &&
          job.acknowledge_status !== 1 &&
          job.acknowledge_status !== '1'
        );
      });
    setFilteredJobs(filtered);
  }, [filters, tomorrowJobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      booking_sub_id: '',
      from_address: '',
      to_address: '',
      pickup_date: '',
    });
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
            <JobsTabs activeTab="tomorrow" user={user}  tabCounts={tabCounts} />

            {/* 4 Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-5 mb-2">
              <input
                type="text"
                name="booking_sub_id" // <-- fix here
                value={filters.booking_sub_id}
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

            {/* Card Grid */}
            <div className="jobs-content">
              {loading ? (
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => (
                      <div
                        key={job.id || idx}
                        className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium ml-auto"><b>Tomorrow</b></span>
                        </div>
                        <div className="mb-3">
                          <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                            <i className="fas fa-car-side"></i> <b>{getCarName(job.car_id)}</b>
                          </h4>

                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <i className="fas fa-receipt text-gray-500"></i> <b>{job.booking_sub_id}</b>
                          </p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          {/* Pickup */}
                          <div>
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-marker-alt text-blue-500"></i> <b>Pickup:</b>
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
                            <span className="text-right"><b>{job.distance} miles Approx</b></span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-calendar-alt text-blue-400"></i> <b>Journey Date:</b>
                            </span>
                            <span className="text-right">
                              <b>
                                {job.pickup_date
                                  ? DateTime.fromFormat(job.pickup_date, "yyyy-MM-dd HH:mm:ss", {
                                    zone: 'Europe/London'
                                  }).toFormat("cccc, dd LLL yyyy")
                                  : ''}
                              </b>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-clock text-purple-500"></i> <b>Journey Time:</b>
                            </span>
                            <span className="text-right">
                              <b>
                                {job.pickup_date
                                  ? DateTime.fromFormat(job.pickup_date, "yyyy-MM-dd HH:mm:ss", {
                                    zone: 'Europe/London'
                                  }).toFormat("hh:mm a")
                                  : ''}
                              </b>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-users text-purple-500"></i> <b>Passengers:</b>
                            </span>
                            <span className="text-right"><b>{job.passengers}</b></span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-suitcase text-pink-500"></i> <b>Luggage:</b>
                            </span>
                            <span className="text-right"><b>{job.luggage}</b></span>
                          </div>
                          <div className="flex justify-end mt-2">
                            {job.acknowledge_status === 1 || job.acknowledge_status === '1' ? (
                              <span className="text-green-600 font-semibold px-3 py-1 rounded bg-green-100 text-sm">
                                <b>Acknowledged</b>
                              </span>
                            ) : (
                              <button
                                className="text-white px-3 py-1 rounded bg-blue-500 text-sm hover:bg-blue-600 hover:text-white transition-colors"
                                onClick={() => handleAcknowledge(job)}
                                disabled={!!ackLoading[job.booking_journey_id]}
                              >
                                <b>{ackLoading[job.booking_journey_id] ? 'Acknowledging...' : 'Acknowledge'}</b>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                      <p><b>No matching jobs found for tomorrow.</b></p>
                    </div>
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

export default TomorrowJourneys;