import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { tomorrow_journeys } from '../api';
import Header from './MainHeader/Header';

const TomorrowJourneys = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tomorrowJobs, setTomorrowJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Only 4 filters: refid, from, to, date
  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    pickup_date: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }
        const response = await tomorrow_journeys(user.driver_id, user.token);
        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];
        setTomorrowJobs(jobs);
        setFilteredJobs(jobs);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const filtered = tomorrowJobs.filter((job) => {
      const match = (key) =>
        filters[key]
          ? job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase())
          : true;
      const matchDate = () =>
        filters.pickup_date
          ? job.pickup_date?.slice(0, 10) === filters.pickup_date
          : true;
      return (
        match('booking_ref_id') &&
        match('from_address') &&
        match('to_address') &&
        matchDate()
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
      booking_ref_id: '',
      from_address: '',
      to_address: '',
      pickup_date: '',
    });
  };

  return (
    <>
      <Header />
    
      <div className="dashboard-layout mx-5 mt-5">
        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <div className="w-full">
            <JobsTabs activeTab="tomorrow" user={user} />

            {/* 4 Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
              <input
                type="text"
                name="booking_ref_id"
                value={filters.booking_ref_id}
                onChange={handleFilterChange}
                placeholder="Booking Ref ID"
                className="input input-bordered w-40"
              />
              <input
                type="text"
                name="from_address"
                value={filters.from_address}
                onChange={handleFilterChange}
                placeholder="From Address"
                className="input input-bordered w-40"
              />
              <input
                type="text"
                name="to_address"
                value={filters.to_address}
                onChange={handleFilterChange}
                placeholder="To Address"
                className="input input-bordered w-40"
              />
              <input
                type="date"
                name="pickup_date"
                value={filters.pickup_date}
                onChange={handleFilterChange}
                className="input input-bordered w-40"
                placeholder="Pickup Date"
              />
              <button
                className="btn btn-outline btn-sm ml-2"
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>

            {/* Card Grid */}
            <div className="jobs-content">
              {loading ? (
                <p>Loading tomorrow's jobs...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => (
                      <div
                        key={job.id || idx}
                        className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">Jewels Airport Transfers</h3>
                          <span className="text-sm text-green-600 font-medium">Tomorrow</span>
                        </div>
                        <div className="mb-3">
                          <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                            <i className="fas fa-car-side"></i> {job.car_id}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                            <i className="fas fa-info-circle text-gray-500"></i>
                            <span className="font-medium text-gray-700">Car Info:</span> {job.car_info}
                          </p>
                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <i className="fas fa-receipt text-gray-500"></i> {job.booking_sub_id}
                          </p>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-marker-alt text-blue-500"></i> Pickup:
                            </span>
                            <span className="text-right">{job.from_address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-pin text-red-500"></i> DropOff:
                            </span>
                            <span className="text-right">{job.to_address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-road text-yellow-500"></i> Distance:
                            </span>
                            <span className="text-right">{job.distance} miles Approx</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-calendar-alt text-blue-400"></i> Journey Date:
                            </span>
                            <span className="text-right">{job.pickup_date?.split(' at ')[0] || job.pickup_date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-users text-purple-500"></i> Passengers:
                            </span>
                            <span className="text-right">{job.passengers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-suitcase text-pink-500"></i> Luggage:
                            </span>
                            <span className="text-right">{job.luggage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-handshake text-green-500"></i> Meet & Greet:
                            </span>
                            <span className="text-right">{job.meet_greet}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                      <p>No matching jobs found for tomorrow.</p>
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