import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { completed_journeys, getAllCars } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
import CompletedJobSkeleton from './Loading/CompletedJobSkeleton';
import { DateTime } from 'luxon';
import Select from 'react-select';
import { useJobsCounts } from './JobsCountsProvider';

const CompletedJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [pagination, setPagination] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cars, setCars] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const { refreshCounts } = useJobsCounts();

  const [filters, setFilters] = useState({
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
    completed: filteredJobs.length,

  };
  useEffect(() => {
  const fetchData = async () => {
    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }

      // ✅ fetch bookings with pagination + filters
      const response = await completed_journeys(user.driver_id, user.token, {
        page,
        per_page: perPage,
        ref_filter: filters.booking_ref_id,
        date: filters.pickup_date,
        vehicle: filters.car_id[0] || ''
      });
      
      setCompletedJobs(response.data);
      setPagination(response.pagination);

      // ✅ fetch cars (same as before)
      const carsArray = await getAllCars(user.driver_id, user.token);
      setCars(Array.isArray(carsArray) ? carsArray : []);

      refreshCounts();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [user, page, filters]);
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
    const filtered = completedJobs.filter((job) => {
      const matchText = (key) =>
        job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      // Convert pickup_date to 'YYYY-MM-DD' for comparison
      let jobDateISO = '';
      if (job.pickup_date) {
        const dt = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        jobDateISO = dt.isValid ? dt.toISODate() : '';
      }

      let dateMatch = true;
      if (filters.pickup_date) {
        dateMatch = jobDateISO === filters.pickup_date;
      }

      const carMatch = !filters.car_id || filters.car_id.length === 0 || filters.car_id.includes(job.car_id);


      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        (!filters.from_address || matchText('from_address')) &&
        (!filters.to_address || matchText('to_address')) &&
        (!filters.waypoint || matchText('waypoint')) &&
        (!filters.passengers || matchText('passengers')) &&
        (!filters.luggage || matchText('luggage')) &&
        (!filters.distance || matchText('distance')) &&
        (!filters.bid_expiry || matchText('bid_expiry')) &&
        dateMatch &&
        carMatch
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
      waypoint: '',
      pickup_date: '',
      passengers: '',
      luggage: '',
      distance: '',
      car_id: '',
      bid_expiry: '',
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
                type="date"
                name="pickup_date"
                value={filters.pickup_date}
                onChange={handleFilterChange}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CompletedJobSkeleton key={i} />
                  ))}
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
                          <span className="text-sm text-blue-600 font-medium ml-auto"><b>Completed</b></span>
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


                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-calendar-alt text-blue-400"></i> <b>Journey Date:</b>
                            </span>
                            <span className="text-right"><b>{job.pickup_date?.split(' at ')[0] || job.pickup_date}</b></span>
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
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-calendar-alt text-blue-400"></i> <b>Fare Accepted:</b>
                            </span>
                            <span className="text-right"><b>&pound;{job.biding_amount}</b></span>
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

        </div>
      </div>
    </>
  );
};

export default CompletedJobs;