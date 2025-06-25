import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './MainHeader/Header';
import { bidJob, fetchAvailableJobs, fetchJourneyDetails, getAllCars, checkBidJobs } from '../api';
import JobsTabs from './JobsTabs';
import Loading from './Loading/Loading';
import { DateTime } from 'luxon';


const PAGE_SIZE = 6;

export default function AvailableJob() {
    const location = useLocation();
    const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeItem, setActiveItem] = useState('dashboard');
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [filters, setFilters] = useState({
        booking_ref_id: '',
        from_address: '',
        to_address: '',
        waypoint: '',
        pickup_date: '',
        passengers: '',
        luggage: '',
        distance: '',
        car_id: '',
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
    const [cars, setCars] = useState([]);
    const clearFilters = () => {
        setFilters({
            booking_ref_id: '',
            from_address: '',
            to_address: '',
            waypoint: '',
            pickup_date: '',
            passengers: '',
            luggage: '',
            distance: '',
            car_id: '',
            bid_expiry: '',
        });
    };
    const tabCounts = {
        available: filteredJobs.length, // Quotation tab
       
    };

    useEffect(() => {
        if (user?.driver_id && user?.token) {
            const getJobsAndCars = async () => {
                setLoading(true);
                try {
                    const [jobsArray, carsArray] = await Promise.all([
                        fetchAvailableJobs(user.driver_id, user.token),
                        getAllCars(user.driver_id, user.token)
                    ]);

                    setJobs(jobsArray);
                    setFilteredJobs(jobsArray);
                    setCars(Array.isArray(carsArray) ? carsArray : []);
                    setReaction(false);
                } catch (error) {
                    console.error(error);
                    setJobs([]);
                    setFilteredJobs([]);
                    setCars([]);
                    setLoading(false);
                    setReaction(false);
                } finally {
                    setLoading(false);
                    setReaction(false);
                }
            };
            getJobsAndCars();
        }
    }, [user, reaction]);

    const getCarName = (car_id) => {
        const car = cars.find((c) => c.car_id === car_id);
        return car ? car.car_name : car_id;
    };

    useEffect(() => {
        const filtered = jobs.filter((job) => {
            const matchText = (key) =>
                job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

            // Convert pickup_date to 'YYYY-MM-DD' for comparison
            let jobDateISO = '';
            if (job.pickup_date) {
                const dt = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
                jobDateISO = dt.isValid ? dt.toISODate() : '';
            }

            let dateMatch = true;
            if (filters.pickup_date) {
                dateMatch = jobDateISO === filters.pickup_date;
            }

            let carMatch = true;
            if (filters.car_id) {
                carMatch = job.car_id === filters.car_id;
            }

            return (
                (!filters.booking_ref_id || matchText('booking_ref_id')) &&
                (!filters.from_address || matchText('from_address')) &&
                (!filters.to_address || matchText('to_address')) &&
                (!filters.waypoint || matchText('waypoint')) &&
                (!filters.passengers || matchText('passengers')) &&
                (!filters.luggage || matchText('luggage')) &&
                (!filters.distance || matchText('distance')) &&
                (!filters.bid_expiry || matchText('bid_expiry')) &&
                dateMatch &&
                carMatch
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
        setIsChecked(true);
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
    // setSubmitting(true);
    try {
        // Check if already assigned
        const checkResult = await checkBidJobs(selectedJob.booking_journey_id, user.token);
        if (checkResult && (checkResult.assigned === true || checkResult.assigned === 1)) {
            alert('This job has already been assigned to another driver.');
            setShowModal(false);
            setQuote('');
            setIsChecked(false);
            setReaction(true); // refresh jobs
            // setSubmitting(false);
            return;
        }

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
            {actionLoading && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <Loading />
                    </div>
                </div>
            )}
            <div className="dashboard-layout mx-5 mt-5">
                <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
                    <div className="w-full">
                        <div className="w-full">
                            <JobsTabs activeTab="available" user={user} tabCounts={tabCounts} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 px-5 mb-2">
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
                                name="pickup_date"
                                value={filters.pickup_date}
                                onChange={handleFilterChange}
                                placeholder="Journey Date"
                                className="p-2 border border-gray-300 rounded-md w-full"
                            />
                            <select
                                name="car_id"
                                value={filters.car_id}
                                onChange={handleFilterChange}
                                className="p-2 border border-gray-300 rounded-md w-full"
                            >
                                <option value="">All Vehicles</option>
                                {cars
                                    .map(car => (
                                        <option key={car.car_id} value={car.car_id}>
                                            {car.car_name}
                                        </option>
                                    ))}
                            </select>
                            <input
                                type="button"
                                value="Clear"
                                onClick={clearFilters}
                                className="p-2 border border-gray-300 rounded-md w-full cursor-pointer text-center bg-gray-100 hover:bg-red-100 text-red-500 font-semibold"
                            />
                        </div>


                        {loading ? (
                            <div className="col-span-full flex justify-center items-center h-64">
                                <Loading />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                {paginatedJobs.length > 0 ? (
                                    paginatedJobs.map((job, idx) => (
                                        <div
                                            key={job.booking_id || idx}
                                            className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                {/* Removed h3 and kept Bid text right-aligned */}
                                                <span className="text-sm text-blue-600 font-medium ml-auto"><b>Quotation</b></span>
                                            </div>
                                            <div className="mb-3">
                                                <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                                                    <i className="fas fa-car-side"></i> <b>{getCarName(job.car_id)}</b>
                                                </h4>
                                                <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                                    <i className="fas fa-receipt text-gray-500"></i> <b>{job.booking_ref_id}</b>
                                                </p>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-700">
                                                {/* Pickup */}
                                                <div>
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-map-marker-alt text-blue-500"></i> <b>Pickup:</b>
                                                    </span>
                                                    <span className="block ml-6"><b>{job.from_address}</b></span>
                                                </div>
                                                {/* Waypoints */}
                                                {job.waypoint && job.waypoint.trim() !== '' && (
                                                    job.waypoint.split('|').map((wp, i) =>
                                                        wp.trim() && (
                                                            <div key={i}>
                                                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                                                    <i className="fas fa-map-marker-alt text-blue-500"></i>
                                                                    <b>Waypoint{job.waypoint.split('|').length > 1 ? ` ${i + 1}` : ''}:</b>
                                                                </span>
                                                                <span className="block ml-6"><b>{wp.trim()}</b></span>
                                                            </div>
                                                        )
                                                    )
                                                )}
                                                {/* DropOff */}
                                                <div>
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-map-pin text-red-500"></i> <b>DropOff:</b>
                                                    </span>
                                                    <span className="block ml-6"><b>{job.to_address}</b></span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-road text-yellow-500"></i> <b>Distance:</b>
                                                    </span>
                                                    <span className="text-right"><b>{job.distance} Approx</b></span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-calendar-alt text-blue-400"></i> <b>Journey Date:</b>
                                                    </span>
                                                    <span className="text-right"><b>{job.pickup_date?.split(' at ')[0]}</b></span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-clock text-purple-500"></i> <b>Journey Time:</b>
                                                    </span>
                                                    <span className="text-right">
                                                        <b>{job.pickup_date
                                                            ? DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", {
                                                                zone: 'Europe/London'
                                                            }).toFormat("hh:mm a")
                                                            : ''}</b>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-users text-purple-500"></i> <b>Passengers:</b>
                                                    </span>
                                                    <span className="text-right"><b>{job.passengers}</b></span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                        <i className="fas fa-suitcase text-pink-500"></i> <b>Luggage:</b>
                                                    </span>
                                                    <span className="text-right"><b>{job.luggage}</b></span>
                                                </div>

                                            </div>
                                            <div className="flex flex-col space-y-3">
                                                {job.car_info && (
                                                    <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                                                        <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                                            <i className="fas fa-info-circle text-blue-500"></i> {job.car_info}
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => handleViewDetails(job)}
                                                    className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded w-full"
                                                >
                                                    View Details
                                                </button>
                                            </div>

                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                                        <p>No available jobs matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        )}

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

                    {showModal && selectedJob && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                                <button
                                    onClick={handleCloseModal}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                                {loadingDetails ? (
                                    <div className="flex flex-col items-center justify-center h-40">
                                        <Loading />
                                        <span className="mt-4 text-gray-600">Loading details...</span>
                                    </div>
                                ) : detailsError ? (
                                    <div className="text-red-600 text-center">{detailsError}</div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-bold text-gray-800">Submit Your Quote</h2>
                                            <span className="text-green-600 font-bold">
                                                Guide Price: £{selectedJob.guidedprice ?? 'N/A'}
                                            </span>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex items-center mb-2">
                                                <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
                                                <span className="font-medium text-gray-700">
                                                    Bid Expiry: {selectedJob.bid_expiry_date ?? 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <i className="fas fa-clock mr-2 text-blue-600"></i>
                                                <span className="font-medium text-gray-700">
                                                    Bid Expire Time: {selectedJob.bid_expiry_time ?? 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <input
                                                type="number"
                                                placeholder="£ Quote Here"
                                                value={quote}
                                                onChange={(e) => setQuote(e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="mt-4 mb-2 flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => setIsChecked(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-gray-700">
                                                By submitting your quote, you are accepting the Jewels Airport Transfers{' '}
                                                <a href="https://jat-uk.com/instructions-and-terms" target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                                    terms and conditions
                                                </a>
                                            </span>
                                        </div>
                                        <button
                                            className={`w-full p-3 rounded text-white font-medium ${!isChecked || !quote ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                            disabled={!isChecked || !quote}
                                            onClick={handleSubmitBid}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>


        </>
    );
}
