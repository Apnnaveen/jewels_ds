import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { upcoming_journey_details } from '../api';
import './css/Available.css';
import './css/Dashboard.css'; // Sidebar layout styles

const UpcomingJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('upcoming');
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    pickup_date_from: '',
    pickup_date_to: ''
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
        if (Array.isArray(data)) {
          setUpcomingJobs(data);
          setFilteredJobs(data);
        } else {
          setUpcomingJobs([]);
          setFilteredJobs([]);
          setError('Invalid data format received.');
        }
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
    if (!Array.isArray(upcomingJobs)) {
      setFilteredJobs([]);
      return;
    }

    const filtered = upcomingJobs.filter((job) => {
      if (!job || typeof job !== 'object') return false;

      const matchText = (key) =>
        filters[key]
          ? (job[key] || '').toString().toLowerCase().includes(filters[key].toLowerCase())
          : true;

      const withinDateRange = () => {
        const jobDateStr = job.pickup_date?.split(' at ')[0];
        if (!jobDateStr) return true;

        const jobDate = new Date(jobDateStr);
        if (isNaN(jobDate)) return false;

        const from = filters.pickup_date_from ? new Date(filters.pickup_date_from) : null;
        const to = filters.pickup_date_to ? new Date(filters.pickup_date_to) : null;

        if (from && jobDate < from) return false;
        if (to && jobDate > to) return false;

        return true;
      };

      return (
        matchText('booking_ref_id') &&
        matchText('from_address') &&
        matchText('to_address') &&
        withinDateRange()
      );
    });

    setFilteredJobs(filtered);
  }, [filters, upcomingJobs]);

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
      <button className="global-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="fas fa-bars"></i>
      </button>

      <div className="dashboard-layout">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          open={sidebarOpen}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <h2> &nbsp; &nbsp;Upcoming Jobs</h2>

          <JobsTabs activeTab="upcoming" user={user} />

          <div className="jobs-content">
            {/* {loading ? (
              <p>Loading upcoming jobs...</p>
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
                    </tr>
                    <tr>
                      <th>
                        <input
                          type="text"
                          name="booking_ref_id"
                          placeholder="Filter"
                          value={filters.booking_ref_id}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          name="from_address"
                          placeholder="Filter"
                          value={filters.from_address}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          name="to_address"
                          placeholder="Filter"
                          value={filters.to_address}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="date"
                          name="pickup_date_from"
                          value={filters.pickup_date_from}
                          onChange={handleFilterChange}
                          className="filter-input"
                          style={{ marginBottom: '5px' }}
                        />
                        <input
                          type="date"
                          name="pickup_date_to"
                          value={filters.pickup_date_to}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>
                          No matching jobs found.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job, index) => (
                        <tr key={job.id || index}>
                          <td>{job.booking_ref_id}</td>
                          <td>{job.from_address}</td>
                          <td>{job.to_address}</td>
                          <td>{job.pickup_date}</td>
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
    </>
  );
};

export default UpcomingJobs;
