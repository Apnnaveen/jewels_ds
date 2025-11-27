import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { upcoming_journey_details, updateJobData, getAllCars, assignDriverToJourney, unassignDriverFromJourney, getSupplierMappedDrivers, getcountrycode, add_driver, acknowledgeStatus, getAssignsOnDate, checkBidJobsTomorrow, checkUserToken } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
import UpcomingJourneysSkeleton from './Loading/UpcomingJourneysSkeleton';
import { DateTime } from 'luxon';
import Select from 'react-select';
import { useJobsCounts } from './JobsCountsProvider';

const UpcomingJobs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverList, setDriverList] = useState([]);
  const [driverModalLoading, setDriverModalLoading] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignedDriverId, setAssignedDriverId] = useState(null);
  const { refreshCounts } = useJobsCounts();
  const [driverSearch, setDriverSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(5); // or 4, as you wish
  const [pagination, setPagination] = useState(null);
  const supplierId = user?.driver_id;
  const [conflictDriverId, setConflictDriverId] = useState(null);
  const [conflictJobs, setConflictJobs] = useState([]);
  const [conflictSelectedJob, setConflictSelectedJob] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [disabledButton, setDisabledButton] = useState(new Set());
  const [disabledDriverIds, setDisabledDriverIds] = useState(new Set());
  const [ackLoading, setAckLoading] = useState({});
const validateUserToken = async () => {
    if (!user?.driver_id || !user?.token) {
        // No user info in localStorage/session
        return;
    }

    try {
        const result = await checkUserToken(user.driver_id, user.token);

        // Check if token is missing in database
        if (!result?.token) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('user');
            navigate('/');
        }
        // Optional: match check (only if DB token is not empty)
        else if (result.token !== user.token) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('user');
            navigate('/');
        }
    } catch (error) {
        // Only show alert if this is a real API/network failure, not on first load
        console.error('Token validation failed:', error);
    }
};

useEffect(() => {
    const timer = setTimeout(() => {
        validateUserToken();  // 🔒 run after slight delay
    }, 2000); // wait 2 seconds after mount

    return () => clearTimeout(timer);
}, []);
  const [formData, setFormData] = useState({
    supplier_id: supplierId || '',
    email: '',
    first_name: '',
    last_name: '',
    country_code: '44',
    mobile_number: '0',
    vehicle: '',
    car_reg: '',
    make: '',
    vehicle_colour: '',
    member_type: 'subs',
    title: '',
    password: '',
  });

  // Filters
  const [filters, setFilters] = useState({
    booking_ref_id: '',
    from_address: '',
    to_address: '',
    pickup_date: '',
    car_id: [],
  });

  const clearFilters = () => {
    setFilters({
      booking_ref_id: '',
      from_address: '',
      to_address: '',
      pickup_date: '',
      car_id: [],
    });
  };

  const tabCounts = {
    upcoming: filteredJobs.length,
  };

  const [cars, setCars] = useState([]);

  // Fetch jobs
  // ...existing code...
  const fetchUpcomingJobs = async () => {
    try {
      setLoading(true);
      if (!user?.driver_id || !user?.token) {
        setError('User not authenticated');
        return;
      }
      // Prepare params for API
      const params = {
        page,
        per_page: perPage,
        ref_filter: filters.booking_ref_id,
        date: filters.pickup_date,
        vehicle: filters.car_id[0] || '', // only first car_id for now
        from_address: filters.from_address,
        to_address: filters.to_address,
      };

      const [response, carsData] = await Promise.all([
        upcoming_journey_details(user.driver_id, user.token, params),
        getAllCars(user.driver_id, user.token)
      ]);
      console.log("up",response);
      
      refreshCounts();
      
      // response: { data: [...], pagination: {...} }
      const jobs = Array.isArray(response.data) ? response.data : [];
      setPagination(response.pagination || null);

      const uniqueJobs = Object.values(
        jobs.reduce((acc, job) => {
          const key = job.booking_journey_id || job.id;
          acc[key] = job;
          return acc;
        }, {})
      );

      const jobsWithPhoneCodes = await Promise.all(
        uniqueJobs.map(async (job) => {
          try {
            if (job.mobile_code) {
              const phoneCodeData = await getcountrycode(job.mobile_code, user.token);
              return { ...job, phone_code: phoneCodeData.phone_code };
            }
          } catch (err) {
            console.error(`Failed to get phone code for ${job.mobile_code}`, err);
          }
          return { ...job, phone_code: '' };
        })
      );

      setUpcomingJobs(jobsWithPhoneCodes);
      setFilteredJobs(jobsWithPhoneCodes);
      setCars(Array.isArray(carsData) ? carsData : []);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Fetch jobs when filters or page changes
  useEffect(() => {
    fetchUpcomingJobs();
    // eslint-disable-next-line
  }, [user, page, filters]);


  useEffect(() => {
    const fetchCars = async () => {
      try {
        const carsResponse = await getAllCars(supplierId, user.token);

        const formattedCars = (carsResponse || []).map((car) => {
          const rawName = car.name || car.car_name || car.vehicle_name || 'Unknown';
          return {
            label: rawName.replace(/_/g, ' '),
            value: car.car_id,
          };
        });

        setVehicleTypes(formattedCars);
      } catch (error) {
        console.error('Error fetching cars:', error);
      }
    };

    fetchCars();
  }, [supplierId]);

  const userVehicleIds = user.vehicle_id.split(',').map(id => id.trim());
  const filteredCars = cars.filter(car => userVehicleIds.includes(car.car_id));
  const vehicleOptions = filteredCars.map(car => ({
    label: car.car_name,
    value: car.car_id,
  }));
  const getCarName = (car_id) => {
    const car = cars.find((c) => c.car_id === car_id);
    return car ? car.car_name : car_id;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only digits for country_code field
    const newValue = name === "country_code"
      ? value.replace(/\D/g, "") // remove non-numeric characters
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['email', 'first_name', 'last_name', 'mobile_number', 'vehicle', 'car_reg', 'make'];
    const missing = required.find((f) => !formData[f]);
    if (missing) return alert(`Please fill in ${missing.replace('_', ' ')}`);

    setActionLoading(true);

    try {
      const submitData = { ...formData };
      // Add new driver
      await add_driver(submitData, user.token);
      alert('Driver added successfully!');


      setModalOpen(false);
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };
  // Filter jobs
  useEffect(() => {
    const filtered = upcomingJobs.filter((job) => {
      // Booking Ref filter
      const bookingRefMatch = !filters.booking_ref_id ||
        job.booking_ref_id?.toLowerCase().includes(filters.booking_ref_id.toLowerCase());

      // From Address filter
      const fromAddressMatch = !filters.from_address ||
        job.from_address?.toLowerCase().includes(filters.from_address.toLowerCase());

      // To Address filter
      const toAddressMatch = !filters.to_address ||
        job.to_address?.toLowerCase().includes(filters.to_address.toLowerCase());

      // Date filter
      let jobDateISO = '';
      if (job.pickup_date) {
        const dt = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        jobDateISO = dt.isValid ? dt.toISODate() : '';
      }
      const dateMatch = !filters.pickup_date || jobDateISO === filters.pickup_date;

      // Car filter
      const carMatch = !filters.car_id || filters.car_id.length === 0 || filters.car_id.includes(job.car_id);

      return (
        bookingRefMatch &&
        fromAddressMatch &&
        toAddressMatch &&
        dateMatch &&
        carMatch
      );
    });

    setFilteredJobs(filtered);
  }, [filters, upcomingJobs]);


  const handleFilterChange = (e) => {
  const { name, value } = e.target;
  setFilters(prev => ({ ...prev, [name]: value }));
  setPage(1);
};

  const handleStatusUpdate = async (job, status_code) => {
    setDisabledButton(prev => new Set(prev).add(job.booking_journey_id));

    setActionLoading(true);
    try {
      await updateJobData({
        driver_id: user.driver_id,
        booking_journey_id: job.booking_journey_id || job.id,
        status_code,
        token: user.token,
      });
      alert('Status updated successfully!');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to update job status');
    } finally {
      setDisabledButton(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.booking_journey_id);
        return newSet;
      });
      setActionLoading(false);
    }
  };

  const handleShowDriverList = async (job) => {
    setSelectedJob(job);
    setShowDriverModal(true);
    await fetchMappedDrivers(job);
  };

  const fetchMappedDrivers = async (job) => {
    try {
      const supplier_id = user?.driver_id;
      const booking_journey_id = job?.booking_journey_id;

      if (!supplier_id || !booking_journey_id) {
        alert("Missing supplier ID or booking journey ID");
        return;
      }

      setDriverModalLoading(true);

      const data = await getSupplierMappedDrivers({
        supplier_id,
        booking_jou_id: booking_journey_id,
        token: user?.token,
      });

      setDriverList(data);

      // ✅ Identify and store assigned driver
      const assigned = data.find((driver) => driver.is_assigned);
      if (assigned) {
        setAssignedDriverId(assigned.driver_id);
      } else {
        setAssignedDriverId(null);
      }

    } catch (err) {
      alert("Failed to fetch driver list: " + err.message);
      setDriverList([]);
      setAssignedDriverId(null);
    } finally {
      setDriverModalLoading(false);
    }
  };


  const handleAssign = async (driver_id, skipConflictCheck = false) => {
    setDisabledDriverIds(prev => new Set(prev).add(driver_id));
    const booking_journey_id = selectedJob?.booking_journey_id;
    const token = user?.token;

    if (!booking_journey_id || !token) {
      alert('Missing booking or token');
      setDisabledDriverIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(driver_id);
        return newSet;
      });
      return;
    }

    const fareInput = document.querySelector(`#fare_${driver_id}`);
    const fare = fareInput?.value;

    if (!fare) {
      alert('Please enter fare');
      setDisabledDriverIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(driver_id);
        return newSet;
      });
      return;
    }

    // Get pickup_date in ISO format
    const dt = DateTime.fromFormat(selectedJob.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
    const jobDate = dt.isValid ? dt.toISODate() : '';

    if (!skipConflictCheck && jobDate) {
      const conflicts = await getAssignsOnDate(driver_id, jobDate, token);
      const filtered = (conflicts || []).filter(j => j.booking_journey_id !== booking_journey_id);
      if (filtered.length > 0) {
        setConflictJobs(filtered);
        setConflictDriverId(driver_id);
        setConflictSelectedJob(selectedJob);
        setShowConflictModal(true);
        setDisabledDriverIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(driver_id);
          return newSet;
        });
        return;
      }
    }

    try {
      await assignDriverToJourney({
        booking_jou_id: booking_journey_id,
        driver_id,
        fare,
        token,
      });

      alert('Driver assigned successfully');
      setAssignedDriverId(driver_id);
      await fetchMappedDrivers(selectedJob);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Assign failed');
    } finally {
      setDisabledDriverIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(driver_id);
        return newSet;
      });
    }
  };



  const handleUnassign = async (driver_id) => {
    setDisabledDriverIds(prev => new Set(prev).add(driver_id));

    try {
      const booking_jou_id = selectedJob?.booking_journey_id;
      const token = user?.token;

      if (!booking_jou_id || !token) {
        alert('Missing booking or token');
        return;
      }

      await unassignDriverFromJourney({
        booking_jou_id,
        driver_id,
        token,
      });

      alert('Driver unassigned successfully');
      setAssignedDriverId(null); // ✅ clear the assigned driver
      await fetchMappedDrivers(selectedJob);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Unassign failed');
    } finally {
      setDisabledDriverIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(driver_id);
        return newSet;
      });
    }
  };

  const isWithin24Hours = (pickupStr) => {

    const pickup = DateTime.fromFormat(
      pickupStr,
      "cccc, dd LLL yyyy 'at' HH:mm",
      { zone: 'Europe/London' }
    );
    if (!pickup.isValid) return false;
    const now = DateTime.now().setZone('Europe/London');
    const diffHours = pickup.diff(now, 'hours').hours;

    return diffHours <= 24 && diffHours >= 0;
  };
  const handleAcknowledge = async (job) => {
    setActionLoading(true);
    setAckLoading((prev) => ({ ...prev, [job.booking_journey_id]: true }));

    try {
      // Check if the job is still available for this driver
      const checkResult = await checkBidJobsTomorrow(
        job.booking_journey_id,
        user.driver_id,
        user.token
      );

      // if (checkResult && (checkResult.assigned === true || checkResult.assigned === 1)) {
      //   alert('This job has already been assigned to another driver.');
      //   refreshCounts();
      //   return;
      // }

      if (checkResult?.assigned === 0 && checkResult?.message === 'Unassigned for current driver') {
        alert('You have not been assigned this job yet.');
        refreshCounts();
        return;
      }

      const driverIdToUse =
        job.driver_customer_type === "subs"
          ? job.subsid
          : user.driver_id;
      // Proceed with acknowledge
      await acknowledgeStatus({
        driver_id: driverIdToUse,
        booking_journey_id: job.booking_journey_id,
        acknowledge_status: 1,
        token: user.token,
      });
      await fetchUpcomingJobs();


      alert('Job acknowledged successfully!');
      refreshCounts();
    } catch (err) {
      alert(err.message || 'Failed to acknowledge job');
    } finally {
      setAckLoading((prev) => ({ ...prev, [job.booking_journey_id]: false }));
      setActionLoading(false);
    }
  };




  return (
    <>
      <Header />
      {actionLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Loading />
          </div>
        </div>
      )}
      <div className="dashboard-layout mx-5 mt-5">
        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <div className="w-full">
            <JobsTabs activeTab="upcoming" user={user} />

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
                min={new Date().toISOString().split('T')[0]}
                placeholder="Journey Date"
                className="p-2 border border-gray-300 rounded-md w-full"
              />
              <Select
                isMulti
                name="car_id"
                options={vehicleOptions}
                value={vehicleOptions.filter(opt => filters.car_id.includes(opt.value))}
                onChange={selectedOptions => {
                  const selectedValues = selectedOptions.map(option => option.value);
                  setFilters(prev => ({ ...prev, car_id: selectedValues }));
                }}
                className="w-full"
                placeholder="Select Vehicle(s)"
              />
              <input
                type="button"
                value="Clear"
                onClick={clearFilters}
                className="p-2 border border-gray-300 rounded-md w-full cursor-pointer text-center bg-gray-100 hover:bg-red-100 text-red-500 font-semibold"
              />
            </div>

            <div className="jobs-content">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {(Array.from({ length: 6 })).map((_, i) => (
                    <UpcomingJourneysSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => {
                      const jobKey = job.id || job.booking_journey_id || idx;
                      const status = job.icon_status ?? job.status_code;
                      const jobPickupDateTime = DateTime.fromFormat(
                        job.pickup_date,
                        "cccc, dd LLL yyyy 'at' HH:mm",
                        { zone: 'Europe/London' }
                      );
                      const now = DateTime.now().setZone('Europe/London');
                      const hoursSincePickup = jobPickupDateTime.isValid ? now.diff(jobPickupDateTime, 'hours').hours : 0;
                      const isPastPickup = jobPickupDateTime < now;

                      return (
                        <div
                          key={jobKey}
                          className={`rounded-xl p-4 flex flex-col h-full ${isPastPickup
                            ? 'border-2 border-orange-200 shadow-[0_0_10px_rgba(251,146,60,0.6)]'
                            : job.acknowledge_status == 0
                              ? 'border-2 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                              : 'bg-white shadow-md'
                            }`}
                        >
                          {/* Top - Upcoming label */}
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-blue-600 font-medium ml-auto"><b>Upcoming</b></span>
                          </div>

                          {/* Middle - All journey details */}
                          <div className="flex-1 flex flex-col space-y-1 text-sm text-gray-700">
                            {status !== 3 && (() => {
                              const pickupDateTime = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
                              const now = DateTime.now().setZone('Europe/London');
                              const hoursSincePickup = pickupDateTime.isValid ? now.diff(pickupDateTime, 'hours').hours : 0;

                              if (hoursSincePickup >= 8) {
                                return (
                                  <div className="mb-2 bg-red-100 text-red-800 border border-red-300 rounded p-2 flex items-center gap-2 text-xs font-semibold">
                                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                                    The pickup time has already passed by more than 8 hours, but this journey is still not marked as completed. Please update the status.
                                  </div>
                                );
                              } else if (isPastPickup) {
                                return (
                                  <div className="mb-2 bg-orange-100 text-orange-800 border border-orange-300 rounded p-2 flex items-center gap-2 text-xs font-semibold">
                                    <i className="fas fa-exclamation-triangle text-orange-600"></i>
                                    The pickup time has already passed, but this journey is still not marked as completed.
                                  </div>
                                );
                              }

                              return null;
                            })()}


                            {job.acknowledge_status == 1 ? (
                              // ✅ Already acknowledged: badge + date + maybe subs name
                              <div className="mb-2 flex items-center justify-between">
                                <div>
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                                    Acknowledged
                                  </span>
                                  {job.acknowledge_time && (
                                    <span className="text-xs text-gray-600 block mt-1">
                                      {new Date(job.acknowledge_time).toLocaleString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true,
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // ❌ Not acknowledged: button + subs name side by side
                              <div className="pt-3">
                                <div className="flex items-center justify-between">
                                  <button
                                    className="text-white px-2 py-1 rounded bg-blue-500 text-sm hover:bg-blue-600 hover:text-white transition-colors"
                                    onClick={() => handleAcknowledge(job)}
                                    disabled={!!ackLoading[job.booking_journey_id]}
                                  >
                                    <b>{ackLoading[job.booking_journey_id] ? 'Acknowledging...' : 'Acknowledge'}</b>
                                  </button>

                                  {/* 👉 Show sub-driver name on the right */}
                                  {job.driver_customer_type === 'subs' && user.user_type == "supplier" && (
                                    <span className="text-xs text-gray-700 font-medium ml-4 whitespace-nowrap">
                                      <b>Sub ({job.driver_name})</b>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}



                            {job.acknowledge_status == 0 && isWithin24Hours(job.pickup_date) && (
                              <div className="mb-2 text-sm text-red-600 font-bold">
                                <span>This journey has not been acknowledged.</span>
                              </div>
                            )}


                            <div className="mb-2">
                              <h4 className="text-base font-medium text-blue-600 flex items-center gap-2">
                                <i className="fas fa-car-side"></i> <b>{getCarName(job.car_id)}</b>
                              </h4>
                              <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                <i className="fas fa-receipt text-gray-500"></i> <b>{job.booking_ref_id}</b>
                              </p>
                            </div>

                            {/* Pickup */}
                            <div>
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-map-marker-alt text-blue-500"></i> <b>Pickup:</b>
                              </span>
                              <span className="block ml-6"><b>{job.from_address}</b></span>
                            </div>

                            {/* Waypoints */}
                            {job.waypoint?.trim() !== '' &&
                              job.waypoint?.split('|').map((wp, i) =>
                                wp.trim() && (
                                  <div key={i}>
                                    <span className="flex items-center gap-2 font-medium text-gray-600">
                                      <i className="fas fa-map-marker-alt text-blue-500"></i>
                                      <b>Waypoint{job.waypoint?.split('|').length > 1 ? ` ${i + 1}` : ''}:</b>
                                    </span>
                                    <span className="block ml-6"><b>{wp.trim()}</b></span>
                                  </div>
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
                              <span className="text-right"><b>{job.pickup_date?.split(' at ')[0] || job.pickup_date}</b></span>
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
                                <i className="fas fa-suitcase-rolling text-pink-500"></i> <b>Luggage:</b>
                              </span>
                              <span className="text-right"><b>{job.luggage}</b></span>
                            </div>

                            {job.flight_no?.trim() !== '' && (
                              <div className="flex justify-between">
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-plane text-indigo-500"></i> <b>Flight No:</b>
                                </span>
                                <span className="text-right"><b>{job.flight_no}</b></span>
                              </div>
                            )}

                            {job.arrive_from?.trim() !== '' && (
                              <div className="flex justify-between">
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-globe-europe text-teal-500"></i> <b>Arrive From:</b>
                                </span>
                                <span className="text-right"><b>{job.arrive_from}</b></span>
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-handshake text-green-500"></i> <b>Meet & Greet:</b>
                              </span>
                              <span className="text-right">
                                <b>{job.meet_greet === 1 || job.meet_greet === '1' ? 'Yes' : 'No'}</b>
                              </span>
                            </div>

                            {job.driver_supplier_remarks?.trim() !== '' && (
                              <div>
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-id-card text-blue-500"></i><b> Driver Instructions:</b>
                                </span>
                                <div className="ml-6" dangerouslySetInnerHTML={{ __html: job.driver_supplier_remarks }} />
                              </div>
                            )}

                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-pound-sign text-green-600"></i> <b>Fare Accepted:</b>
                              </span>
                              <span className="text-right font-bold text-green-700">
                                <b>
                                  £
                                  {job.driver_customer_type === "subs" && user.user_type === "subs"
                                    ? job.subs_fare
                                    : job.biding_amount}
                                </b>
                              </span>
                            </div>

                            <hr className="my-2 border-t border-gray-300" />

                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-user text-blue-500"></i> <b>Passenger Name:</b>
                              </span>
                              <span className="text-right"><b>{job.name}</b></span>
                            </div>

                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-mobile text-blue-400"></i> <b>Mobile:</b>
                              </span>
                              <span className="text-right">
                                <b>
                                  + ({job.phone_code?.replace('+', '')}) {job.mobile}
                                </b>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-phone-alt text-green-500"></i> <b>Call Office:</b>
                              </span>
                              <span className="text-right">
                                <b> <a href="tel:+442033227723"> +(44)2033227723 </a></b>
                              </span>
                            </div>
                          </div>

                          {/* Bottom fixed button group */}
                          <div className="mt-auto pt-3 flex flex-col gap-2">
                            {user.user_type === 'supplier' && (
                              <button
                                onClick={() => handleShowDriverList(job)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded w-full"
                              >
                                Push Job To Driver
                              </button>
                            )}

                            {job.car_info && (
                              <div className="text-xs text-gray-500 border-t pt-2">
                                <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <i className="fas fa-info-circle text-blue-500"></i> {job.car_info}
                                </p>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 mt-1 flex-wrap">
                              <button
                                type="button"
                                disabled={
                                  status != 0 ||
                                  DateTime.fromFormat(
                                    job.pickup_date,
                                    "cccc, dd LLL yyyy 'at' HH:mm",
                                    { zone: 'Europe/London' }
                                  ).toISODate() !== DateTime.now().setZone('Europe/London').toISODate()
                                  || disabledButton.has(job.booking_journey_id)}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 border rounded-full transition font-semibold
                                  ${status == 1
                                    ? 'bg-orange-500 text-white border-orange-600'
                                    : 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-700 hover:text-white'
                                  } ${status != 0 ||
                                    DateTime.fromFormat(
                                      job.pickup_date,
                                      "cccc, dd LLL yyyy 'at' HH:mm",
                                      { zone: 'Europe/London' }
                                    ).toISODate() !== DateTime.now().setZone('Europe/London').toISODate()
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                  }`}
                                onClick={() => handleStatusUpdate(job, 1)}
                              >
                                Active
                              </button>
                              <button
                                type="button"
                                disabled={status != 1 || disabledButton.has(job.booking_journey_id)}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 border rounded-full transition font-semibold
                                  ${status == 2
                                    ? 'bg-blue-500 text-white border-blue-600'
                                    : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-700 hover:text-white'
                                  } ${status != 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleStatusUpdate(job, 2)}
                              >
                                POB
                              </button>
                              <button
                                type="button"
                                disabled={!(status == 2 || hoursSincePickup >= 2)}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 rounded-full font-semibold transition-all duration-300 
                                ${!(status == 2 || hoursSincePickup >= 2)
                                    ? 'bg-green-100 text-green-400 border border-gray-300 opacity-60 cursor-not-allowed'
                                    : 'bg-green-200 text-green-700 border border-green-300 hover:bg-green-300 hover:text-green-900 hover:shadow-md hover:scale-105'}
                                `}
                                onClick={() => handleStatusUpdate(job, 3)}
                              >
                                Completed
                              </button>

                            </div>
                          </div>
                        </div>

                      );
                    })
                  ) : (
                    <div className="col-span-full text-center text-gray-600 p-4 border rounded-md">
                      <p>No matching jobs found for upcoming journeys.</p>
                    </div>
                  )}
                  {showDriverModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white w-full max-w-4xl p-6 rounded-lg shadow-lg relative">
                        <button
                          onClick={() => {
                            setFormData({
                              supplier_id: supplierId || '',
                              email: '',
                              first_name: '',
                              last_name: '',
                              country_code: '44',
                              mobile_number: '0',
                              vehicle: '',
                              car_reg: '',
                              make: '',
                              vehicle_colour: '',
                              member_type: 'subs',
                            });
                            setModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                        >
                          <i className="fas fa-plus mr-2"></i> Add Driver
                        </button>
                        <button
                          onClick={() => setShowDriverModal(false)}
                          className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold"
                          aria-label="Close modal"
                        >
                          &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
                          Assign a Driver</h2>

                        <div className="mb-5 px-4 py-3 bg-white border rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between text-md text-gray-700">
                          <div className="mb-2 sm:mb-0">
                            <span className="font-bold text-gray-900">Job Reference No:</span>{' '}
                            <span className="font-bold text-gray-900">{selectedJob?.booking_ref_id || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">Quoted Price:</span>{' '}
                            <span className="font-bold text-gray-900">£{selectedJob?.biding_amount || '0'}</span>
                          </div>
                        </div>

                        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                          <input
                            type="text"
                            value={driverSearch}
                            onChange={(e) => setDriverSearch(e.target.value)}
                            placeholder="Search by name or email"
                            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            onClick={() => setDriverSearch('')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-red-100 hover:text-red-600 transition text-sm"
                          >
                            Clear
                          </button>
                        </div>

                        {driverModalLoading ? (
                          <Loading />
                        ) : driverList.length > 0 ? (

                          <div className="overflow-x-auto max-h-[400px] border rounded-lg">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead className="bg-gray-100 text-gray-700 uppercase">
                                <tr>
                                  <th className="px-4 py-2 border">#</th>
                                  <th className="px-4 py-2 border">Name</th>
                                  <th className="px-4 py-2 border">Email</th>
                                  <th className="px-4 py-2 border">Mobile</th>
                                  <th className="px-4 py-2 border">Fare</th>
                                  <th className="px-4 py-2 border">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {driverList
                                  .filter(driver =>
                                    driver.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                                    driver.email.toLowerCase().includes(driverSearch.toLowerCase())
                                  )
                                  .map((driver, idx) => (<tr key={driver.driver_id || idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 border text-center">{idx + 1}</td>
                                    <td className="px-4 py-2 border">{driver.name}</td>
                                    <td className="px-4 py-2 border">{driver.email}</td>
                                    <td className="px-4 py-2 border">{driver.mobile}</td>
                                    <td className="px-4 py-2 border">
                                      <input
                                        type="number"
                                        id={`fare_${driver.driver_id}`}
                                        defaultValue={driver.fare ?? ''}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter fare"
                                        aria-label={`Fare for ${driver.name}`}
                                      />
                                    </td>
                                    <td className="px-4 py-2 border">
                                      <div className="flex flex-wrap gap-2">
                                        {driver.is_assigned ? (
                                          <button
                                            onClick={() => handleUnassign(driver.driver_id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                            disabled={disabledDriverIds.has(driver.driver_id)}

                                          >
                                            Unassign
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleAssign(driver.driver_id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                                            disabled={assignedDriverId !== null && assignedDriverId !== driver.driver_id || disabledDriverIds.has(driver.driver_id)}
                                          >
                                            Assign
                                          </button>
                                        )}
                                      </div>
                                    </td>

                                  </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-red-600 text-center mt-4">No drivers found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {pagination && (
            <div className="flex justify-center gap-4 my-4">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {pagination.current_page} of {pagination.total_pages}</span>
              <button
                disabled={pagination.current_page === pagination.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => {
                setModalOpen(false);
              }}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              Add Driver
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Member Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="member_type"
                      value="subs"
                      checked={formData.member_type === 'subs'}
                      onChange={handleChange}
                      readOnly
                    />
                    <span>Subs</span>
                  </label>
                </div>
              </div>

              {/* Name and Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="border px-3 py-2 rounded w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="border px-3 py-2 rounded w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="border px-3 py-2 rounded w-full"
                    required
                  />
                </div>

                <div className="flex space-x-2">
                  {/* Country Code Field */}
                  <div className="w-28">
                    <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <div className="flex items-center border rounded px-2 py-2 bg-white">
                      {/* + symbol box */}
                      <span className="text-gray-700 text-sm font-semibold mr-1">+</span>

                      {/* actual input field for country code */}
                      <input
                        type="text"
                        id="country_code"
                        name="country_code"
                        placeholder="44"
                        value={formData.country_code}
                        onChange={handleChange}
                        pattern="[0-9]{1,4}"
                        maxLength={4}
                        title="Enter a valid country code"
                        className="w-full border-none focus:ring-0 focus:outline-none text-sm"
                        required
                      />

                    </div>
                  </div>

                  {/* Mobile Number Field */}
                  <div className="flex-1">
                    <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="mobile_number"
                      name="mobile_number"
                      placeholder="Mobile Number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="border px-3 py-2 rounded w-full"
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {vehicleTypes.map((v) => (
                    <label key={v.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="vehicle"
                        value={v.value}
                        checked={formData.vehicle === v.value}
                        onChange={handleChange}
                      />
                      <span>{v.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Car Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="car_reg" className="block text-sm font-medium text-gray-700 mb-1">
                    Car Registration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="car_reg"
                    name="car_reg"
                    placeholder="Car Registration"
                    value={formData.car_reg}
                    onChange={handleChange}
                    className="border px-3 py-2 rounded w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    placeholder="Make and Model"
                    value={formData.make}
                    onChange={handleChange}
                    className="border px-3 py-2 rounded w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vehicle_colour" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Colour
                  </label>
                  <input
                    type="text"
                    id="vehicle_colour"
                    name="vehicle_colour"
                    placeholder="Vehicle Colour"
                    value={formData.vehicle_colour}
                    onChange={handleChange}
                    className="border px-3 py-2 rounded w-full"
                  />
                </div>
              </div>



              <div class="flex items-center">
                <input id="link-checkbox" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                <label for="link-checkbox" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-500">I agree with the <a href="https://jat-uk.com/instructions-and-terms" class="text-blue-600 dark:text-blue-500 hover:underline">terms and conditions</a>.</label>
              </div>

              <button
                type="submit"
                disabled={!agreed}
                className={`w-full text-white py-2 rounded transition ${agreed ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                Add Driver
              </button>
            </form>

          </div>
        </div>
      )}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-5xl p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowConflictModal(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
              This driver already has jobs scheduled on this date!
            </h2>

            <div className="overflow-x-auto border rounded-lg mb-4">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-2 border">Ref</th>
                    <th className="px-4 py-2 border">Pickup</th>
                    <th className="px-4 py-2 border">Dropoff</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {conflictJobs.map((j, idx) => {
                    const pickupDate = new Date(j.pickup_date);
                    return (
                      <tr key={j.booking_journey_id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">{j.booking_sub_id}</td>
                        <td className="px-4 py-2 border">{j.from_address}</td>
                        <td className="px-4 py-2 border">{j.to_address}</td>
                        <td className="px-4 py-2 border">{pickupDate.toLocaleDateString()}</td>
                        <td className="px-4 py-2 border">{pickupDate.toLocaleTimeString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 border rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConflictModal(false);
                  await handleAssign(conflictDriverId, true); // skip check
                }}
                disabled={disabledDriverIds.has(conflictDriverId)}

                className="px-4 py-2 bg-green-600 text-white border border-green-600 rounded hover:bg-green-700"
              >
                Assign Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default UpcomingJobs;
