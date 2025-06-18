import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './MainHeader/Header';
import { bidJob, fetchAvailableJobs, fetchJourneyDetails } from '../api';
import JobsTabs from './JobsTabs';
import Loading from './Loading/Loading';

const PAGE_SIZE = 6;

export default function AvailableJob() {
    const location = useLocation();
    const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
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
    const [loading, setLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const [quote, setQuote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reaction, setReaction] = useState(false);

    useEffect(() => {
        if (user?.driver_id && user?.token) {
            const getJobs = async () => {
                setLoading(true);

                try {
                    const jobsArray = await fetchAvailableJobs(user.driver_id, user.token);
                    setJobs(jobsArray);
                    setFilteredJobs(jobsArray);
                    setReaction(false);
                } catch (error) {
                    console.error(error);
                    setJobs([]);
                    setFilteredJobs([]);
                    setLoading(false);
                    setReaction(false);

                } finally {
                    setLoading(false);
                    setReaction(false);

                }
            };
            getJobs();
        }
    }, [user, reaction]);

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
            setReaction(true);

        } catch (err) {
            setLoading(false);

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
            <Header />
            <div className='mt-20 text-center'>
                <h2 className=''>Available Jobs</h2>
            </div>
            {
                loading ? (<>
                    <Loading /></>
                ) : (
                    <div className="dashboard-layout">
                        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
                            <div className="w-full">
                                <div className="w-full">
                                    <JobsTabs activeTab="available" user={user} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 px-5">
                                    <input
                                        type="text"
                                        name="booking_ref_id"
                                        value={filters.booking_ref_id}
                                        onChange={handleFilterChange}
                                        placeholder="Booking Ref"
                                        className="p-2 border border-gray-300 rounded-md w-full"
                                    />
                                    <input
                                        type="text"
                                        name="from_address"
                                        value={filters.from_address}
                                        onChange={handleFilterChange}
                                        placeholder="From Address"
                                        className="p-2 border border-gray-300 rounded-md w-full"
                                    />
                                    <input
                                        type="text"
                                        name="to_address"
                                        value={filters.to_address}
                                        onChange={handleFilterChange}
                                        placeholder="To Address"
                                        className="p-2 border border-gray-300 rounded-md w-full"
                                    />
                                    <input
                                        type="date"
                                        name="pickup_date_from"
                                        value={filters.pickup_date_from}
                                        onChange={handleFilterChange}
                                        placeholder="From Date"
                                        className="p-2 border border-gray-300 rounded-md w-full"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                    {paginatedJobs.length > 0 ? (
                                        paginatedJobs.map((job, idx) => (
                                            <div
                                                key={job.booking_id || idx}
                                                className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800">Jewels Airport Transfers</h3>
                                                    <span className="text-sm text-green-600 font-medium">Available</span>
                                                </div>
                                                <div className="mb-3">
                                                    <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                                                        <i className="fas fa-car-side"></i> {job.car_id}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                        <i className="fas fa-info-circle text-gray-500"></i>
                                                        <span className="font-medium text-gray-700">Car Info:</span> {job.car_info}
                                                    </p>
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
                                                        <span className="text-right">{job.distance} miles Approx</span>
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
                                                </div>
                                                <button
                                                    onClick={() => handleViewDetails(job)}
                                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                                            <p>No available jobs matching your criteria.</p>
                                        </div>
                                    )}
                                </div>

                                {totalPages > 1 && (
                                    <div className="pagination flex justify-center mt-4">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`px-4 py-2 mx-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 mx-1 bg-gray-200 rounded disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>

                            {showModal && (
                                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
                                        <button
                                            onClick={handleCloseModal}
                                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                            aria-label="Close"
                                        >
                                            &times;
                                        </button>
                                        <div>
                                            {/* {loadingDetails && <div>Loading details...</div>} */}
                                            {detailsError && <div className="text-red-500">{detailsError}</div>}
                                            {selectedJob && (
                                                <>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h2 className="text-xl font-bold"><i className="fas fa-pound-sign"></i> Submit Your Quote</h2>
                                                        <span className="text-gray-600">
                                                            Guide Price: £{selectedJob.guidedprice ?? 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <i className="fas fa-calendar-alt"></i> <b>Bid Expiry:</b> {selectedJob.bid_expiry_date ?? 'N/A'}
                                                    </div>
                                                    <div className="mb-4">
                                                        <i className="fas fa-hourglass-half"></i> <b>Bid Expire Time:</b> {selectedJob.bid_expiry_time ?? 'N/A'}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        placeholder="£ Quote Here"
                                                        value={quote}
                                                        onChange={(e) => setQuote(e.target.value.replace(/[^0-9.]/g, ''))}
                                                        className="w-full p-2 border border-gray-300 rounded mb-4"
                                                    />
                                                    <button
                                                        className={`w-full p-2 rounded ${!isChecked || !quote ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                                        disabled={!isChecked || !quote || submitting}
                                                        onClick={handleSubmitBid}
                                                    >
                                                        {submitting ? 'Submitting...' : 'Submit'}
                                                    </button>
                                                    <div className="mt-4 flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => setIsChecked(e.target.checked)}
                                                            className="mr-2"
                                                        />
                                                        <span>
                                                            By submitting your quote, you are accepting the Jewels Airport Transfers{' '}
                                                            <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                                                terms and conditions
                                                            </a>
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )

            }

        </>
    );
}
