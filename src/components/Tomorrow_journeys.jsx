import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { tomorrow_journeys, getAllCars, acknowledgeStatus, checkBidJobsTomorrow } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
import { DateTime } from 'luxon';
import Select from 'react-select';
import { useJobsCounts } from './JobsCountsProvider';


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
  const [reaction, setReaction] = useState(false);
  const { refreshCounts } = useJobsCounts();

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
    car_id: [],
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
      car_id: [],
      bid_expiry: '',
    });
  };
  const tabCounts = {
    tomorrow: filteredJobs.length, // Quotation tab

  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
        refreshCounts();
        setTomorrowJobs(jobs);
        setFilteredJobs(jobs);
        setCars(Array.isArray(carsArray) ? carsArray : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
        refreshCounts();
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, reaction]);
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
  const handleAcknowledge = async (job) => {
    setActionLoading(true); // Global spinner
    setAckLoading((prev) => ({ ...prev, [job.booking_journey_id]: true }));

    try {
      const checkResult = await checkBidJobsTomorrow(
        job.booking_journey_id,
        user.driver_id,
        user.token
      );

      if (checkResult && (checkResult.assigned === true || checkResult.assigned === 1)) {
        alert('This job has already been assigned to another driver.');
        refreshCounts();
        setReaction(true);
        return;
      }

      if (checkResult?.assigned === 0 && checkResult?.message === 'Unassigned for current driver') {
        alert('You have not been assigned this job yet.');
        refreshCounts();
        setReaction(true);
        return;
      }

      // Proceed with acknowledge
      await acknowledgeStatus({
        driver_id: user.driver_id,
        booking_journey_id: job.booking_journey_id,
        acknowledge_status: 1,
        token: user.token,
      });

      // Update job state in UI
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
      // Show success alert
      alert('Job acknowledged successfully!');
      refreshCounts();

      // Force re-render by updating a state variable
      setReaction(true);
    } catch (err) {
      alert(err.message || 'Failed to acknowledge job');
    } finally {
      // Always stop loading, even after alerts
      setAckLoading((prev) => ({ ...prev, [job.booking_journey_id]: false }));
      setActionLoading(false);
    }
  };


  useEffect(() => {
    const filtered = tomorrowJobs.filter((job) => {
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
        const dt = DateTime.fromFormat(job.pickup_date, "yyyy-MM-dd HH:mm:ss", { zone: 'Europe/London' });
        jobDateISO = dt.isValid ? dt.toISODate() : '';
      }

      const dateMatch = !filters.pickup_date || jobDateISO === filters.pickup_date;
      const carMatch = !filters.car_id || filters.car_id.length === 0 || filters.car_id.includes(job.car_id);

      const fromPostcodeMatch = matchPostcode('from_address');
      const toPostcodeMatch = matchPostcode('to_address');

      return (
        (!filters.booking_sub_id || matchText('booking_sub_id')) &&
        fromPostcodeMatch &&
        toPostcodeMatch &&
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
            <JobsTabs activeTab="tomorrow" user={user} />

            {/* 4 Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-5 mb-2">
              <input
                type="text"
                name="booking_sub_id"
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
                        className="bg-white rounded-xl shadow-md p-4 flex flex-col h-full"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium ml-auto"><b>Tomorrow</b></span>
                        </div>

                        {/* Content block with flex-grow */}
                        <div className="flex-1 flex flex-col space-y-1 text-sm text-gray-700">
                          <div className="mb-2">
                            <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                              <i className="fas fa-car-side"></i> <b>{getCarName(job.car_id)}</b>
                            </h4>

                            <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                              <i className="fas fa-receipt text-gray-500"></i> <b>{job.booking_sub_id}</b>
                            </p>
                          </div>

                          {/* Pickup */}
                          <div>
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-marker-alt text-blue-500"></i> <b>Pickup:</b>
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
                        </div>

                        {/* Bottom pinned button/status */}
                        <div className="mt-auto pt-3">
                          <div className="flex justify-end">
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