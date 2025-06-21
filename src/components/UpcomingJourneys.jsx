// ...existing imports...
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { upcoming_journey_details, updateJobData, getAllCars } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
import { DateTime } from 'luxon';
const UpcomingJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // NEW
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    pickup_date: '',
  });
 const [cars, setCars] = useState([]);
  // Fetch jobs
 useEffect(() => {
    const fetchUpcomingJobs = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }
        const [jobsData, carsData] = await Promise.all([
          upcoming_journey_details(user.driver_id, user.token),
          getAllCars(user.driver_id, user.token)
        ]);
        const jobs = Array.isArray(jobsData) ? jobsData : [];
        setUpcomingJobs(jobs);
        setFilteredJobs(jobs);
        setCars(Array.isArray(carsData) ? carsData : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingJobs();
  }, [user]);
 const getCarName = (car_id) => {
    const car = cars.find((c) => c.car_id === car_id);
    return car ? car.car_name : car_id;
  };
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
    setActionLoading(true);
    try {
      await updateJobData({
        driver_id: user.driver_id,
        booking_journey_id: job.booking_journey_id || job.id,
        status_code,
        token: user.token,
      });
      alert('Status updated successfully!');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to update job status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Header />
      {actionLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Loading />
          </div>
        </div>
      )}
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
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loading />
                </div>
              ) :(
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => {
                      const jobKey = job.id || job.booking_journey_id || idx;
                      // Use icon_status or status_code as the source of truth
                      const status = job.icon_status ?? job.status_code;
                      console.log('Job:', job, 'Status:', status); // Debugging log
                      return (
                        <div
                          key={jobKey}
                          className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium ml-auto">Upcoming</span>
                         </div>
                          <div className="mb-3">
                            <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                              <i className="fas fa-car-side"></i> {getCarName(job.car_id)}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                              <i className="fas fa-info-circle text-gray-500"></i>
                              <span className="font-medium text-gray-700">Car Info:</span> {job.car_info}
                            </p>
                            <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                              <i className="fas fa-receipt text-gray-500"></i> {job.booking_ref_id}
                            </p>
                          </div>
                          <div className="space-y-2 text-sm text-gray-700">
                            {/* Pickup */}
                          <div>
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-marker-alt text-blue-500"></i> Pickup:
                          </span>
                          <span className="block ml-6">{job.from_address}</span>
                          </div>
                          {/* Waypoints */}
                          {job.waypoint && job.waypoint.trim() !== '' && (
                          job.waypoint.split('|').map((wp, i) =>
                              wp.trim() && (
                              <div key={i}>
                                  <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-map-marker-alt text-blue-500"></i>
                                  Waypoint{job.waypoint.split('|').length > 1 ? ` ${i + 1}` : ''}:
                                  </span>
                                  <span className="block ml-6">{wp.trim()}</span>
                              </div>
                              )
                          )
                          )}
                          {/* DropOff */}
                          <div>
                          <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-map-pin text-red-500"></i> DropOff:
                          </span>
                          <span className="block ml-6">{job.to_address}</span>
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
                                     <i className="fas fa-clock text-purple-500"></i> Journey Time:
                                 </span>
                                 <span className="text-right">
                                     {job.pickup_date
                                     ? DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", {
                                         zone: 'Europe/London'
                                         }).toFormat("hh:mm a")
                                     : ''}
                                 </span>
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
                              {/* Active Button */}
                              <button
                                type="button"
                                disabled={status != 0}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 border rounded-full transition font-semibold
                                  ${
                                    status == 1
                                      ? 'bg-orange-500 text-white border-orange-600'
                                      : 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-700 hover:text-white'
                                  } ${status != 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleStatusUpdate(job, 1)}
                              >
                                Active
                                
                              </button>

                              {/* POB Button */}
                              <button
                                type="button"
                                disabled={status != 1}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 border rounded-full transition font-semibold
                                  ${
                                    status == 2
                                      ? 'bg-blue-500 text-white border-blue-600'
                                      : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-700 hover:text-white'
                                  } ${status != 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleStatusUpdate(job, 2)}
                              >
                                POB
                               
                              </button>

                              {/* Completed Button */}
                              <button
                                type="button"
                                disabled={status != 2}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 border rounded-full transition font-semibold
                                  ${
                                    status == 3
                                      ? 'bg-green-500 text-white border-green-600'
                                      : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-700 hover:text-white'
                                  } ${status != 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleStatusUpdate(job, 3)}
                              >
                                Completed
                               
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
// ...existing code...