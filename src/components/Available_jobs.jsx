import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { fetchAvailableJobs, fetchJourneyDetails, bidJob } from '../api';
import './css/Available.css';
import JobsTabs from './JobsTabs';

const PAGE_SIZE = 5;

const AvailableJobs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [filters, setFilters] = useState({
        booking_ref_id: '',
        from_address: '',
        to_address: '',
        pickup_date: '',
        passengers: '',
        luggage: '',
        distance: '',
        car_info: '',
        bid_expiry: '',
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState('');

    // Get user from location.state or localStorage as fallback
    const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (user?.driver_id && user?.token) {
            const getJobs = async () => {
                try {
                    const jobsArray = await fetchAvailableJobs(user.driver_id, user.token);
                    setJobs(jobsArray);
                } catch (error) {
                    console.error(error);
                    setJobs([]);
                }
            };
            getJobs();
        } else {
            setJobs([]);
        }
    }, [user]);

    // Filtering logic
    const filteredJobs = jobs.filter(job =>
        (filters.booking_ref_id === '' || (job.booking_ref_id || '').toLowerCase().includes(filters.booking_ref_id.toLowerCase())) &&
        (filters.from_address === '' || (job.from_address || '').toLowerCase().includes(filters.from_address.toLowerCase())) &&
        (filters.to_address === '' || (job.to_address || '').toLowerCase().includes(filters.to_address.toLowerCase())) &&
        (filters.pickup_date === '' || (job.pickup_date || '').toLowerCase().includes(filters.pickup_date.toLowerCase())) &&
        (filters.passengers === '' || String(job.passengers || '').toLowerCase().includes(filters.passengers.toLowerCase())) &&
        (filters.luggage === '' || String(job.luggage || '').toLowerCase().includes(filters.luggage.toLowerCase())) &&
        (filters.distance === '' || String(job.distance || '').toLowerCase().includes(filters.distance.toLowerCase())) &&
        (filters.car_info === '' || (job.car_info || '').toLowerCase().includes(filters.car_info.toLowerCase())) &&
        (filters.bid_expiry === '' || ((job.bid_expiry_date || '') + ' ' + (job.bid_expiry_time || '')).toLowerCase().includes(filters.bid_expiry.toLowerCase()))
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Handle filter change
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Handle view details button click
 const handleViewDetails = async (job) => {
    setShowModal(true);
    setSelectedJob(job); // Show basic info immediately
    setLoadingDetails(true);
    setDetailsError('');
    try {
        const details = await fetchJourneyDetails(job.booking_journey_id, user.driver_id, user.token);
        // Merge fetched details into selectedJob
        setSelectedJob(prev => ({
            ...prev,
            ...details.data // adjust if your API returns { data: { ... } }
        }));
    } catch (err) {
        setDetailsError('Failed to load details.');
    }
    setLoadingDetails(false);
};

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedJob(null);
        setDetailsError('');
        setQuote('');
        setIsChecked(false);
    };

    const [isChecked, setIsChecked] = useState(false);
    const [quote, setQuote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmitBid = async () => {
    if (!selectedJob || !quote || !isChecked) return;
    setSubmitting(true);
    try {
        await bidJob({
            booking_journey_id: selectedJob.booking_journey_id, // <-- Use from selectedJob
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

    return (
        <div style={{ padding: '30px' }}>
            <div className="jobs-tabs">
                       <JobsTabs activeTab="available" user={user} />

            </div>
            <div className="available-jobs-container">
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
                    <table className="jobs-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                            <tr>
                                <th>Booking Ref</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Pickup Date</th>
                                <th>Passengers</th>
                                <th>Luggage</th>
                                <th>Distance</th>
                                <th>Car Info</th>
                                <th>Action</th>
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
                                        type="text"
                                        name="pickup_date"
                                        placeholder="Filter"
                                        value={filters.pickup_date}
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
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedJobs.length > 0 ? (
                                paginatedJobs.map((job, idx) => (
                                    <tr key={job.booking_id || idx}>
                                        <td data-label="Booking Ref">{job.booking_ref_id}</td>
                                        <td data-label="From">{job.from_address}</td>
                                        <td data-label="To">{job.to_address}</td>
                                        <td data-label="Pickup Date">{job.pickup_date}</td>
                                        <td data-label="Passengers">{job.passengers}</td>
                                        <td data-label="Luggage">{job.luggage}</td>
                                        <td data-label="Distance">{job.distance}</td>
                                        <td data-label="Car Info">{job.car_info}</td>
                                        <td>
                                            <button
                                                className="view-details-btn"
                                                style={{
                                                    padding: '4px 12px',
                                                    background: '#1976d2',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.95rem'
                                                }}
                                                onClick={() => handleViewDetails(job)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="no-jobs-message">No jobs available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx}
                                className={currentPage === idx + 1 ? 'active' : ''}
                                onClick={() => handlePageChange(idx + 1)}
                            >
                                {idx + 1}
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="modal-content" style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '24px',
                        minWidth: '340px',
                        maxWidth: '95vw',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={handleCloseModal}
                            style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                background: 'transparent',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                            aria-label="Close"
                        >&times;</button>
                        <div>
                            {loadingDetails && <div>Loading details...</div>}
                            {detailsError && <div style={{ color: 'red' }}>{detailsError}</div>}
                            {selectedJob && (
                                <>
                                     <div style={{ fontWeight: 600, marginBottom: 8 }}>
                                        Submit Your Quote: <span style={{ color: 'green' }}>Guide Price: £{selectedJob.guidedprice ?? 'N/A'}</span>
                                    </div>
                                    <div style={{ marginBottom: 6 }}>
                                        <span role="img" aria-label="calendar">📅</span> <b>Bid Expiry:</b> {selectedJob.bid_expiry_date ?? 'N/A'}
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <span role="img" aria-label="clock">⏰</span> <b>Bid Expire Time:</b> {selectedJob.bid_expiry_time ?? 'N/A'}
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="£ Quote Here"
                                        value={quote}
                                        onChange={e => setQuote(e.target.value.replace(/[^0-9.]/g, ''))}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            marginBottom: '12px'
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
                                            cursor: isChecked && quote ? 'pointer' : 'not-allowed'
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
                                            onChange={e => setIsChecked(e.target.checked)}
                                            style={{ marginRight: 6 }}
                                        />
                                        By submitting your quote, you are accepting the Jewels Airport Transfers <a href="#" target="_blank" rel="noopener noreferrer">terms and conditions</a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailableJobs;