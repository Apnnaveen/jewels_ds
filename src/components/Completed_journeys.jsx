import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { completed_journeys } from '../api'; // your provided API
import Header from './MainHeader/Header';

// import './css/Scheduled.css'; 


const CompletedJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('completed');

  const [completedJobs, setCompletedJobs] = useState([]);
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

        const data = await completed_journeys(user.driver_id, user.token);
        setCompletedJobs(data);
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
    const filtered = completedJobs.filter((job) => {
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
  }, [filters, completedJobs]);

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
        <h2 className=''>Completed Journeys</h2>
      </div>
      <div className="dashboard-layout mx-5">

        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>

          {/* Static tab bar */}
       <div className="w-full">
            <div className="w-full">
              <JobsTabs activeTab="completed" user={user} />
            </div>

          <div className="jobs-content">
            {loading ? (
              <p>Loading completed jobs...</p>
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
                      <th><input type="text" name="booking_ref_id" value={filters.booking_ref_id} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th><input type="text" name="from_address" value={filters.from_address} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th><input type="text" name="to_address" value={filters.to_address} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th>
                        <input type="date" name="pickup_date_from" value={filters.pickup_date_from} onChange={handleFilterChange} className="filter-input" style={{ marginBottom: '5px' }} />
                        <input type="date" name="pickup_date_to" value={filters.pickup_date_to} onChange={handleFilterChange} className="filter-input" />
                      </th>
                      <th><input type="text" name="passengers" value={filters.passengers} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th><input type="text" name="luggage" value={filters.luggage} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th><input type="text" name="distance" value={filters.distance} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th><input type="text" name="car_info" value={filters.car_info} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
                      <th><input type="text" name="meet_greet" value={filters.meet_greet} onChange={handleFilterChange} placeholder="Filter" className="filter-input" /></th>
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
      </div>
    </>
  );
};

export default CompletedJobs;
