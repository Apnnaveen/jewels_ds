import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { fetchAvailableJobs, fetchJourneyDetails, bidJob } from '../api';
import './css/Available.css';
import './css/Dashboard.css';

const PAGE_SIZE = 5;

const AvailableJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    waypoint:'',
    pickup_date_from: '',
    pickup_date_to: '',
    passengers: '',
    luggage: '',
    distance: '',
    car_info: '',
    bid_expiry: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [quote, setQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parsePickupDate = (pickupStr) => {
    if (!pickupStr) return null;
    const datePart = pickupStr.split(' at ')[0];
    return new Date(datePart);
  };

  useEffect(() => {
    if (user?.driver_id && user?.token) {
      const getJobs = async () => {
        try {
          const jobsArray = await fetchAvailableJobs(user.driver_id, user.token);
          setJobs(jobsArray);
          setFilteredJobs(jobsArray);
        } catch (error) {
          console.error(error);
          setJobs([]);
          setFilteredJobs([]);
        }
      };
      getJobs();
    }
  }, [user]);

  useEffect(() => {
    const filtered = jobs.filter((job) => {
      const matchText = (key) =>
        job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      const jobDate = parsePickupDate(job.pickup_date);
      const from = filters.pickup_date_from ? new Date(filters.pickup_date_from) : null;
      const to = filters.pickup_date_to ? new Date(filters.pickup_date_to) : null;
      const dateMatch =
        (!from || (jobDate && jobDate >= from)) &&
        (!to || (jobDate && jobDate <= to));

      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        (!filters.from_address || matchText('from_address')) &&
        (!filters.to_address || matchText('to_address')) &&
        (!filters.waypoint || matchText('waypoint')) &&
        (!filters.passengers || matchText('passengers')) &&
        (!filters.luggage || matchText('luggage')) &&
        (!filters.distance || matchText('distance')) &&
        (!filters.car_info || matchText('car_info')) &&
        (!filters.bid_expiry || matchText('bid_expiry')) &&
        dateMatch
      );
    });

    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [filters, jobs]);

  const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = async (job) => {
    setShowModal(true);
    setSelectedJob(job);
    setLoadingDetails(true);
    setDetailsError('');
    try {
      const details = await fetchJourneyDetails(job.booking_journey_id, user.driver_id, user.token);
      setSelectedJob(prev => ({ ...prev, ...details[0] }));
    } catch (err) {
      setDetailsError('Failed to load details.');
    }
    setLoadingDetails(false);
  };

  const handleSubmitBid = async () => {
    if (!selectedJob || !quote || !isChecked) return;
    setSubmitting(true);
    try {
      await bidJob({
        booking_journey_id: selectedJob.booking_journey_id,
        driver_id: user.driver_id,
        email: user.email,
        fare: quote,
        token: user.token,
      });
      alert('Bid submitted successfully!');
      setShowModal(false);
      setQuote('');
      setIsChecked(false);
    } catch (err) {
      alert('Failed to submit bid: ' + err.message);
    }
    setSubmitting(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedJob(null);
    setDetailsError('');
    setQuote('');
    setIsChecked(false);
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
          <h2> &nbsp; &nbsp;Available Jobs</h2>
          <JobsTabs activeTab="available" user={user} />

          <div className="jobs-content">
            <div style={{ overflowX: 'auto' }}>
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Waypoint</th>
                    <th>Journey Date</th>
                    <th>Passengers</th>
                    <th>Luggage</th>
                    <th>Distance</th>
                    <th>Car Info</th>
                    <th>Action</th>
                  </tr>
                  <tr>
                    <th><input type="text" name="booking_ref_id" value={filters.booking_ref_id} onChange={handleFilterChange} className="filter-input" /></th>
                    <th><input type="text" name="from_address" value={filters.from_address} onChange={handleFilterChange} className="filter-input" /></th>
                    <th><input type="text" name="to_address" value={filters.to_address} onChange={handleFilterChange} className="filter-input" /></th>
                    <th><input type="text" name="waypoint" value={filters.waypoint} onChange={handleFilterChange} className="filter-input" /></th>
                    <th>
                      <input type="date" name="pickup_date_from" value={filters.pickup_date_from} onChange={handleFilterChange} className="filter-input" style={{ marginBottom: 5 }} />
                      <input type="date" name="pickup_date_to" value={filters.pickup_date_to} onChange={handleFilterChange} className="filter-input" />
                    </th>
                    <th><input type="text" name="passengers" value={filters.passengers} onChange={handleFilterChange} className="filter-input" /></th>
                    <th><input type="text" name="luggage" value={filters.luggage} onChange={handleFilterChange} className="filter-input" /></th>
                    <th><input type="text" name="distance" value={filters.distance} onChange={handleFilterChange} className="filter-input" /></th>
                    <th><input type="text" name="car_info" value={filters.car_info} onChange={handleFilterChange} className="filter-input" /></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.length > 0 ? (
                    paginatedJobs.map((job, idx) => (
                      <tr key={job.booking_id || idx}>
                        <td>{job.booking_ref_id}</td>
                        <td>{job.from_address}</td>
                        <td>{job.to_address}</td>
                        <td>{job.waypoint}</td>
                        <td>{job.pickup_date}</td>
                        <td>{job.passengers}</td>
                        <td>{job.luggage}</td>
                        <td>{job.distance}</td>
                        <td>{job.car_info}</td>
                        <td>
                          <button onClick={() => handleViewDetails(job)} className="view-details-btn">View</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px 0', color: '#888' }}>
                        No available jobs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => handlePageChange(i + 1)} className={currentPage === i + 1 ? 'active' : ''}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
              </div>
            )}
          </div>

          {showModal && (
  <div
    className="modal-overlay"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div
      className="modal-content"
      style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '24px',
        minWidth: '340px',
        maxWidth: '95vw',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        position: 'relative',
      }}
    >
      <button
        onClick={handleCloseModal}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
        }}
        aria-label="Close"
      >
        &times;
      </button>
      <div>
        {loadingDetails && <div>Loading details...</div>}
        {detailsError && <div style={{ color: 'red' }}>{detailsError}</div>}
        {selectedJob && (
          <>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Submit Your Quote:{' '}
              <span style={{ color: 'green' }}>
                Guide Price: £{selectedJob.guidedprice ?? 'N/A'}
              </span>
            </div>
            <div style={{ marginBottom: 6 }}>
              📅 <b>Bid Expiry:</b> {selectedJob.bid_expiry_date ?? 'N/A'}
            </div>
            <div style={{ marginBottom: 12 }}>
              ⏰ <b>Bid Expire Time:</b> {selectedJob.bid_expiry_time ?? 'N/A'}
            </div>
            <input
              type="number"
              placeholder="£ Quote Here"
              value={quote}
              onChange={(e) => setQuote(e.target.value.replace(/[^0-9.]/g, ''))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginBottom: '12px',
              }}
            />
            <button
              style={{
                width: '100%',
                background: isChecked && quote ? '#1976d2' : '#aaa',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 0',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: '10px',
                cursor: isChecked && quote ? 'pointer' : 'not-allowed',
              }}
              disabled={!isChecked || !quote || submitting}
              onClick={handleSubmitBid}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <div style={{ fontSize: '0.9rem', color: '#333' }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              By submitting your quote, you are accepting the Jewels Airport Transfers{' '}
              <a href="#" target="_blank" rel="noopener noreferrer">
                terms and conditions
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </>
  );
};

export default AvailableJobs;
