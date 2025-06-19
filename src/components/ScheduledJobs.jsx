import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import Header from './MainHeader/Header';

import { scheduled_journey_details, confirmAvailability, declineJob } from '../api'; 
// import './css/Available.css';
// import './css/Dashboard.css';
// import './css/Scheduled.css'; 

const ScheduledJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('scheduled');
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
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
    await confirmAvailability({
      driver_id: user.driver_id,
      booking_journey_id: job.booking_journey_id ,
      status: 1,
      token: user.token,
    });
    // Optionally, update the job list or show a success message
    alert('Availability confirmed!');
    // Optionally, refresh jobs:
    // fetchScheduledJobs();
  } catch (err) {
    alert(err.message || 'Failed to confirm availability');
  }
};
const handleDecline = async (job) => {
  try {
    if (!user?.driver_id || !user?.token) {
      setError('User not authenticated');
      return;
    }
    await declineJob({
      driver_id: user.driver_id,
      booking_journey_id: job.booking_journey_id,
      token: user.token,
    });
    alert('Job declined!');
    // Optionally, refresh jobs:
    // fetchScheduledJobs();
  } catch (err) {
    alert(err.message || 'Failed to decline job');
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

  // Filter logic
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
     <div className='mt-20 text-center mb-2'>
        <h2 className=''>Scheduled Journeys</h2>
      </div>
      <div className="dashboard-layout mx-5">

        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>

          {/* Static tab bar */}
    <div className="w-full">
            <div className="w-full">
              <JobsTabs activeTab="scheduled" user={user} />
            </div>

          <div className="jobs-content">
            <div style={{ overflowX: 'auto' }}>
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Booking Ref</th>
                    <th>Pickup</th>
                    <th>Dropoff</th>
                    <th>Meet & Greet</th>
                    <th>Distance</th>
                    <th>Price</th>
                    <th>Journey Date & Time</th>
                    <th>Action</th>
                  </tr>
                  <tr>
                    {[
                      'vehicle_type',
                      'booking_ref_id',
                      'from_address',
                      'to_address',
                      'meet_and_greet',
                      'distance',
                      'quoted_price'
                    ].map((field) => (
                      <th key={field}>
                        <input
                          type="text"
                          name={field}
                          placeholder="Filter"
                          value={filters[field]}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                    ))}
                    <th>
                      <input
                        type="date"
                        name="pickup_date"
                        value={filters.pickup_date}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center' }}>No matching jobs found.</td>
                    </tr>
                  ) : (
                    filteredJobs.map((job, index) => {
                      return (
                        <tr key={job.id || index}>
                          <td>{job.vehicle_type || 'Saloon'}</td>
                          <td>{job.booking_ref_id}</td>
                          <td>{job.from_address}</td>
                          <td>{job.to_address}</td>
                          <td>{job.meet_and_greet || 'No'}</td>
                          <td>{job.distance ? `${job.distance} miles` : 'N/A'}</td>
                          <td>£{job.quoted_price || '10.00'}</td>
                          <td>{job.pickup_date || 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                className="accept-btn" onClick={() => handleAccept(job)}
                              >
                                Accept
                              </button>
                              <button className="reject-btn" onClick={() => handleDecline(job)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default ScheduledJobs;
