import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { fetchAvailableJobs, fetchJourneyDetails, bidJob } from '../api';
import './css/Available.css';
// import './css/Scheduled.css'

const PAGE_SIZE = 6;

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
    waypoint: '',
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

      const jobDate = new Date(job.pickup_date?.split(' at ')[0]);
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
      <Sidebar
        user={user}
        onLogout={handleLogout}
        open={sidebarOpen}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />

      <div className='dashboard-header'>
        <h2 className=''>Available Jobs</h2>
      </div>



      <div className="dashboard-layout">
        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <div className="wrapper">
            <div className="tabs-container">
              <JobsTabs activeTab="available" user={user} />
            </div>


            <div className="card-filters">
              <div className="filter-group">
                <input
                  type="text"
                  name="booking_ref_id"
                  value={filters.booking_ref_id}
                  onChange={handleFilterChange}
                  placeholder="Booking Ref"
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <input
                  type="text"
                  name="from_address"
                  value={filters.from_address}
                  onChange={handleFilterChange}
                  placeholder="From Address"
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <input
                  type="text"
                  name="to_address"
                  value={filters.to_address}
                  onChange={handleFilterChange}
                  placeholder="To Address"
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <input
                  type="date"
                  name="pickup_date_from"
                  value={filters.pickup_date_from}
                  onChange={handleFilterChange}
                  placeholder="From Date"
                  className="filter-input"
                />
                <input
                  type="date"
                  name="pickup_date_to"
                  value={filters.pickup_date_to}
                  onChange={handleFilterChange}
                  placeholder="To Date"
                  className="filter-input"
                />
              </div>
            </div>


            <div className="jobs-cards-container">
              {paginatedJobs.length > 0 ? (
                paginatedJobs.map((job, idx) => (
                  <div key={job.booking_id || idx} className="job-card">
                    <div className="job-card-header">
                      <h3 className="job-title">Jewels Airport Transfers</h3>
                      <span className="job-status">Available</span>
                    </div>

                    <div className="job-section">
                      <h4 className="section-title">
                        <i className="fas fa-car-side"></i> {job.car_id}
                      </h4>
                      <p className="vehicle-description">
                        <span className="detail-label"><i className="fas fa-info-circle"></i> Car Info:</span> {job.car_info}
                      </p>
                      <p className="booking-ref">
                        <i className="fas fa-receipt"></i> {job.booking_ref_id}
                      </p>
                    </div>

                    <div className="job-details">
                      <div className="detail-row">
                        <span className="detail-label">
                          <i className="fas fa-map-marker-alt icon icon-primary"></i>
                          Pickup:
                        </span>
                        <span className="detail-value">{job.from_address}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label"><i className="fas fa-map-pin"></i> DropOff:</span>
                        <span className="detail-value">{job.to_address}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">
                          <i className="fas fa-road icon icon-warning"></i>
                          Distance:
                        </span>
                        <span className="detail-value">{job.distance} miles Approx</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">
                          <i className="fas fa-calendar-alt icon icon-info"></i>
                          Journey Date:
                        </span>
                        <span className="detail-value">{job.pickup_date?.split(' at ')[0]}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label"><i className="fas fa-clock"></i> Journey Time:</span>
                        <span className="detail-value">{job.pickup_date?.split(' at ')[1]}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(job)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-jobs-message">
                  <p>No available jobs matching your criteria.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={currentPage === i + 1 ? 'active' : ''}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>


          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button onClick={handleCloseModal} aria-label="Close">
                  &times;
                </button>
                <div>
                  {loadingDetails && <div>Loading details...</div>}
                  {detailsError && <div style={{ color: 'red' }}>{detailsError}</div>}
                  {selectedJob && (
                    <>
                      <div className="modal-header">
                        <i className="fas fa-pound-sign"></i> Submit Your Quote:
                        <span className="guide-price">
                          Guide Price: £{selectedJob.guidedprice ?? 'N/A'}
                        </span>
                      </div>
                      <div className="bid-expiry">
                        <i className="fas fa-calendar-alt"></i> <b>Bid Expiry:</b> {selectedJob.bid_expiry_date ?? 'N/A'}
                      </div>
                      <div className="bid-expiry">
                        <i className="fas fa-hourglass-half"></i> <b>Bid Expire Time:</b> {selectedJob.bid_expiry_time ?? 'N/A'}
                      </div>

                      <input
                        type="number"
                        placeholder="£ Quote Here"
                        value={quote}
                        onChange={(e) => setQuote(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="quote-input"
                      />
                      <button
                        className={`submit-bid-btn ${!isChecked || !quote ? 'disabled' : ''}`}
                        disabled={!isChecked || !quote || submitting}
                        onClick={handleSubmitBid}
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                      <div className="terms-checkbox">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
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