import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { completed_journeys, getAllCars } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
import { DateTime } from 'luxon';

const CompletedJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cars, setCars] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

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
        const [response, carsArray] = await Promise.all([
                                        completed_journeys(user.driver_id, user.token),
                                        getAllCars(user.driver_id, user.token)
                                    ]);
        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];
        setCompletedJobs(jobs);
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

  useEffect(() => {
    const filtered = completedJobs.filter((job) => {
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
  }, [filters, completedJobs]);

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
            <JobsTabs activeTab="completed" user={user} />

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
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loading />
                </div>
              ) :(
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => (
                      <div
                        key={job.id || idx}
                        className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                      >
                         <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-blue-600 font-medium ml-auto">Completed</span>
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
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                      <p>No matching jobs found.</p>
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

export default CompletedJobs;