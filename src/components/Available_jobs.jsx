import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { fetchAvailableJobs } from '../api';
import './css/Available.css';

const PAGE_SIZE = 1;

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

    return (
        <div>
            <div className="jobs-tabs">
                <button
                    className="tab-btn active"
                    onClick={() => navigate('/available-jobs', { state: { user } })}
                >
                    Available Jobs
                </button>
                <button
                    className="tab-btn"
                    onClick={() => navigate('/bid-history', { state: { user } })}
                >
                    Bid History
                </button>
                <button
                    className="tab-btn"
                    onClick={() => navigate('/scheduled-jobs', { state: { user } })}
                >
                    Scheduled Jobs
                </button>
                <button
                    className="tab-btn"
                    onClick={() => navigate('/upcoming-journeys', { state: { user } })}
                >
                    Upcoming Journeys
                </button>
                <button
                    className="tab-btn"
                    onClick={() => navigate('/completed-jobs', { state: { user } })}
                >
                    Completed Jobs
                </button>
            </div>
            <div className="available-jobs-container">
                <h1>Available Jobs</h1>
                <div className="table-responsive">
                    <table className="jobs-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="text"
                                        name="booking_ref_id"
                                        placeholder="Filter"
                                        value={filters.booking_ref_id}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Booking Ref
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="from_address"
                                        placeholder="Filter"
                                        value={filters.from_address}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    From
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="to_address"
                                        placeholder="Filter"
                                        value={filters.to_address}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    To
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="pickup_date"
                                        placeholder="Filter"
                                        value={filters.pickup_date}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Pickup Date
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="passengers"
                                        placeholder="Filter"
                                        value={filters.passengers}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Passengers
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="luggage"
                                        placeholder="Filter"
                                        value={filters.luggage}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Luggage
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="distance"
                                        placeholder="Filter"
                                        value={filters.distance}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Distance
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="car_info"
                                        placeholder="Filter"
                                        value={filters.car_info}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Car Info
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        name="bid_expiry"
                                        placeholder="Filter"
                                        value={filters.bid_expiry}
                                        onChange={handleFilterChange}
                                        className="filter-input"
                                    /><br />
                                    Bid Expiry
                                </th>
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
                                        <td data-label="Bid Expiry">{job.bid_expiry_date} {job.bid_expiry_time}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="no-jobs-message">No jobs available</td>
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
        </div>
    );
};

export default AvailableJobs;