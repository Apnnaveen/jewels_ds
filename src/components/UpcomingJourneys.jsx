import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { upcoming_journey_details } from '../api';
import './css/Available.css';
import './css/Dashboard.css'; // Ensure layout and sidebar styles are applied

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
    passengers: '',
    luggage: '',
    distance: '',
    car_info: '',
    meet_greet: '',
    pickup_date_from: '',
    pickup_date_to: ''
  });

  const parsePickupDate = (pickupStr) => {
    if (!pickupStr) return null;
    const datePart = pickupStr.split(' at ')[0];
    return new Date(datePart);
  };

 useEffect(() => {
  const fetchData = async () => {
    try {
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }

      const response = await upcoming_journey_details(user.driver_id, user.token);
      console.log("API Response:", response);

      const data = Array.isArray(response?.data) ? response.data : [];

      setUpcomingJobs(data);
      setFilteredJobs(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user]);


  useEffect(() => {
    const filtered = upcomingJobs.filter((job) => {
      const matchText = (key) =>
        job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      const withinDateRange = () => {
        const jobDate = parsePickupDate(job.pickup_date);
        if (!jobDate) return false;

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
      {/* Sidebar Toggle Button */}
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
          <h2>Upcoming Jobs</h2>

          <JobsTabs activeTab="upcoming" user={user} />

          <div className="jobs-content">
            {loading ? (
              <p>Loading upcoming jobs...</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : (
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
                      <th>Car Info</th>
                      <th>Meet & Greet</th>
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
                      <th>
                        <input
                          type="text"
                          name="passengers"
                          placeholder="Filter"
                          value={filters.passengers}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          name="luggage"
                          placeholder="Filter"
                          value={filters.luggage}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          name="distance"
                          placeholder="Filter"
                          value={filters.distance}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          name="car_info"
                          placeholder="Filter"
                          value={filters.car_info}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                      <th>
                        <input
                          type="text"
                          name="meet_greet"
                          placeholder="Filter"
                          value={filters.meet_greet}
                          onChange={handleFilterChange}
                          className="filter-input"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan="9">No matching jobs found.</td>
                      </tr>
                    ) : (
                      filteredJobs.map((job, index) => (
                        <tr key={job.id || index}>
                          <td>{job.booking_ref_id}</td>
                          <td>{job.from_address}</td>
                          <td>{job.to_address}</td>
                          <td>{job.pickup_date}</td>
                          <td>{job.passengers}</td>
                          <td>{job.luggage}</td>
                          <td>{job.distance}</td>
                          <td>{job.car_info}</td>
                          <td>{job.meet_greet}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UpcomingJobs;
