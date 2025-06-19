import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import Loading from './Loading/Loading';
import Header from './MainHeader/Header';
import { scheduled_journey_details, confirmAvailability, declineJob } from '../api';

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

  const [filters, setFilters] = useState({
    vehicle_type: '',
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    meet_and_greet: '',
    distance: '',
    quoted_price: '',
    pickup_date: ''
  });

  const handleAccept = async (job) => {
    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
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
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to confirm availability');
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
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to decline job');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
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
      }
    };

    fetchScheduledJobs();
  }, [user]);

  useEffect(() => {
    const filtered = scheduledJobs.filter((job) => {
      const includes = (key) =>
        filters[key]
          ? job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase())
          : true;

      const isSameDate = () => {
        if (!filters.pickup_date) return true;
        const jobDateStr = job.pickup_date?.split(' at ')[0];
        if (!jobDateStr) return false;
        return new Date(jobDateStr).toDateString() === new Date(filters.pickup_date).toDateString();
      };

      return (
        includes('vehicle_type') &&
        includes('booking_ref_id') &&
        includes('from_address') &&
        includes('to_address') &&
        includes('meet_and_greet') &&
        includes('distance') &&
        includes('quoted_price') &&
        isSameDate()
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
              <JobsTabs activeTab="scheduled" user={user} />
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4 items-end">
              <input
                type="text"
                name="vehicle_type"
                value={filters.vehicle_type}
                onChange={handleFilterChange}
                placeholder="Vehicle"
                className="input input-bordered w-40"
              />
              <input
                type="text"
                name="booking_ref_id"
                value={filters.booking_ref_id}
                onChange={handleFilterChange}
                placeholder="Booking Ref"
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
                placeholder="Pickup Date"
                className="input input-bordered w-40"
              />
              <button
                className="btn btn-outline btn-sm ml-2"
                onClick={() => setFilters({
                  vehicle_type: '',
                  booking_ref_id: '',
                  from_address: '',
                  to_address: '',
                  meet_and_greet: '',
                  distance: '',
                  quoted_price: '',
                  pickup_date: ''
                })}
              >
                Clear
              </button>
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
                          <h3 className="text-lg font-semibold text-gray-800">Jewels Airport Transfers</h3>
                          <span className="text-sm text-blue-600 font-medium">Scheduled</span>
                        </div>
                        <div className="mb-3">
                          <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                            <i className="fas fa-car-side"></i> {job.vehicle_type || 'Saloon'}
                          </h4>
                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <i className="fas fa-receipt text-gray-500"></i> {job.booking_ref_id}
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
                            <span className="text-right">{job.distance ? `${job.distance} miles` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-calendar-alt text-blue-400"></i> Journey Date:
                            </span>
                            <span className="text-right">{job.pickup_date?.split(' at ')[0]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-clock text-purple-500"></i> Journey Time:
                            </span>
                            <span className="text-right">{job.pickup_date?.split(' at ')[1]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="flex items-center gap-2 font-medium text-gray-600">
                              <i className="fas fa-pound-sign text-green-500"></i> Price:
                            </span>
                            <span className="text-right">£{job.quoted_price || '10.00'}</span>
                          </div>
                        </div>
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
