import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { tomorrow_journeys } from '../api';

import './css/Scheduled.css'; 


const TomorrowJourneys = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('tomorrow');
  const [tomorrowJobs, setTomorrowJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    passengers: '',
    luggage: '',
    distance: '',
    car_info: '',
    meet_greet: '',
    pickup_date_from: '',
    pickup_date_to: ''
  });

  // Fetch tomorrow's jobs safely
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }

        const response = await tomorrow_journeys(user.driver_id, user.token);

        // Defensive extraction: supports both array or object with nested array
        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : [];

        if (!Array.isArray(jobs)) {
          throw new Error('Invalid jobs data');
        }

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

  // Filter logic
  useEffect(() => {
    const filtered = tomorrowJobs.filter((job) => {
      const matchText = (key) =>
        job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      const withinDateRange = () => {
        const jobDate = new Date(job.pickup_date);
        const from = filters.pickup_date_from ? new Date(filters.pickup_date_from) : null;
        const to = filters.pickup_date_to ? new Date(filters.pickup_date_to) : null;

        if (from && jobDate < from) return false;
        if (to && jobDate > to) return false;
        return true;
      };

      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        (!filters.from_address || matchText('from_address')) &&
        (!filters.to_address || matchText('to_address')) &&
        (!filters.passengers || matchText('passengers')) &&
        (!filters.luggage || matchText('luggage')) &&
        (!filters.distance || matchText('distance')) &&
        (!filters.car_info || matchText('car_info')) &&
        (!filters.meet_greet || matchText('meet_greet')) &&
        withinDateRange()
      );
    });

    setFilteredJobs(filtered);
  }, [filters, tomorrowJobs]);

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
     

      <div className="dashboard-layout">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          open={sidebarOpen}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
         <h2> &nbsp; &nbsp;Tomorrow's Jobs</h2>
      <div className="wrapper">
        <div className="tabs-container">
          <JobsTabs activeTab="tomorrow" user={user} />
        </div>
          <div className="jobs-content">
            {/* {loading ? (
              <p>Loading tomorrow's jobs...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : ( */}
              <div style={{ overflowX: 'auto' }}>
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>Booking Ref ID</th>
                      <th>From Address</th>
                      <th>To Address</th>
                      <th>Pickup Date</th>
                      <th>Passengers</th>
                      <th>Luggage</th>
                      <th>Distance</th>
                      <th>Meet & Greet</th>
                    </tr>
                    <tr>
                      {[
                        'booking_ref_id',
                        'from_address',
                        'to_address',
                        'pickup_date_from',
                        'pickup_date_to',
                        'passengers',
                        'luggage',
                        'distance',
                        'meet_greet'
                      ].map((key) =>
                        key === 'pickup_date_from' || key === 'pickup_date_to' ? (
                          <th key={key}>
                            <input
                              type="date"
                              name={key}
                              value={filters[key]}
                              onChange={handleFilterChange}
                              className="filter-input"
                            />
                          </th>
                        ) : (
                          <th key={key}>
                            <input
                              type="text"
                              name={key}
                              placeholder="Filter"
                              value={filters[key]}
                              onChange={handleFilterChange}
                              className="filter-input"
                            />
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan="8">No matching jobs found for tomorrow.</td>
                      </tr>
                    ) : (
                      filteredJobs.map((job, index) => (
                        <tr key={job.id || index}>
                          <td>{job.booking_sub_id}</td>
                          <td>{job.from_address}</td>
                          <td>{job.to_address}</td>
                          <td>{job.pickup_date}</td>
                          <td>{job.passengers}</td>
                          <td>{job.luggage}</td>
                          <td>{job.distance}</td>
                          <td>{job.meet_greet}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            {/* )} */}
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TomorrowJourneys;
