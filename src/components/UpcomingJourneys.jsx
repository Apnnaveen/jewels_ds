import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { upcoming_journey_details, updateJobData } from '../api';
import Header from './MainHeader/Header';

const UpcomingJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const [jobStatus, setJobStatus] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    pickup_date: '',
  });

  // Fetch jobs
  useEffect(() => {
    const fetchUpcomingJobs = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }
        const data = await upcoming_journey_details(user.driver_id, user.token);
        const jobs = Array.isArray(data) ? data : [];
        setUpcomingJobs(jobs);
        setFilteredJobs(jobs);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingJobs();
  }, [user]);

  // Filter jobs
  useEffect(() => {
    const filtered = upcomingJobs.filter((job) => {
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
  }, [filters, upcomingJobs]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle status update
  const handleStatusUpdate = async (job, status_code) => {
    try {
      await updateJobData({
        driver_id: user.driver_id,
        booking_journey_id: job.booking_journey_id || job.id,
        status_code,
        token: user.token,
      });
      setJobStatus((prev) => ({
        ...prev,
        [job.id || job.booking_journey_id]: status_code,
      }));
    } catch (err) {
      alert(err.message || 'Failed to update job status');
    }
  };

  return (
    <>
      <Header />
      <div className="dashboard-layout mx-5 mt-5">
        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <div className="w-full">
            <JobsTabs activeTab="upcoming" user={user} />

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
            </div>

            {/* Card Grid */}
            <div className="jobs-content">
              {loading ? (
                <p>Loading upcoming jobs...</p>
              ) : error ? (
                <p className="error">{error}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => {
                      const jobKey = job.id || job.booking_journey_id || idx;
                      const status = jobStatus[jobKey] || job.status_code;
                      return (
                        <div
                          key={jobKey}
                          className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">Jewels Airport Transfers</h3>
                            <span className="text-sm text-blue-600 font-medium">Upcoming</span>
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
                              <span className="text-right">
                                {job.meet_greet === 1 || job.meet_greet === '1' ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                              {/* Active (status 1) */}
                              <button
                                type="button"
                                className={`inline-flex items-center p-2 border border-orange-300 rounded-full bg-orange-100 hover:bg-orange-200 transition relative`}
                                title="Active"
                                onClick={() => handleStatusUpdate(job, 1)}
                              >
                                <i className="fas fa-running text-orange-500 text-lg"></i>
                                {status === 1 && (
                                  <span className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
                                )}
                              </button>
                              {/* Pop (status 2) */}
                              <button
                                type="button"
                                className={`inline-flex items-center p-2 border border-blue-300 rounded-full bg-blue-100 hover:bg-blue-200 transition relative`}
                                title="Passenger On Board"
                                onClick={() => handleStatusUpdate(job, 2)}
                              >
                                <i className="fas fa-wheelchair text-blue-500 text-lg"></i>
                                {status === 2 && (
                                  <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                      <p>No matching jobs found for upcoming journeys.</p>
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

export default UpcomingJobs;