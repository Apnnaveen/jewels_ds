import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './MainHeader/Header';
import { bidJob, fetchAvailableJobs, fetchJourneyDetails, getAllCars } from '../api';
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
    const [cars, setCars] = useState([]);

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

            const jobDateStr = job.pickup_date?.split(' at ')[0];

            let dateMatch = true;
            if (filters.pickup_date) {
                dateMatch = jobDateStr === filters.pickup_date;
            }

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
                                    <JobsTabs activeTab="available" user={user} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-5 mb-2">
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
                                                    <h3 className="text-lg font-semibold text-gray-800">Jewels Airport Transfers</h3>
                                                    <span className="text-sm text-blue-600 font-medium">Available</span>
                                                </div>
                                                <div className="mb-3">
                                                    <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                                                        <i className="fas fa-car-side"></i> {getCarName(job.car_id)}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                        <i className="fas fa-info-circle text-gray-500"></i>
                                                        <span className="font-medium text-gray-700">Car Info:</span><span  className="text-right">{job.car_info}</span> 
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
                                                    {/* Waypoint display logic */}
                                                    {job.waypoint && job.waypoint.trim() !== '' && (
                                                        job.waypoint.split('|').map((wp, i) => (
                                                            wp.trim() && (
                                                                <div className="flex justify-between" key={i}>
                                                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                                                        <i className="fas fa-map-marker-alt text-blue-500"></i> Waypoint{job.waypoint.split('|').length > 1 ? ` ${i + 1}` : ''}:
                                                                    </span>
                                                                    <span className="text-right">{wp.trim()}</span>
                                                                </div>
                                                            )
                                                        ))
                                                    )}
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
                                                        <span className="text-right">{job.distance} Approx</span>
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
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-bold text-gray-800">Submit Your Quote</h2>
                                            <span className="text-green-600 font-bold">Guide Price: £{selectedJob.guidedprice ?? 'N/A'}</span>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex items-center mb-2">
                                                <i className="fas fa-calendar-alt mr-2 text-blue-600"></i>
                                                <span className="font-medium text-gray-700"> Bid Expiry: {selectedJob.bid_expiry_date ?? 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <i className="fas fa-clock mr-2 text-blue-600"></i>
                                                <span className="font-medium text-gray-700">Bid Expire Time: {selectedJob.bid_expiry_time ?? 'N/A'}</span>
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
                                                <a href="#" target="_blank" rel="noopener noreferrer" className="text-blue-500">
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
                                        
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                
            
        </>
    );
}
