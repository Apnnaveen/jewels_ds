import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { upcoming_journey_details, updateJobData, getAllCars, assignDriverToJourney, unassignDriverFromJourney, getSupplierMappedDrivers, getcountrycode, add_driver } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';
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
  const [countryCodes, setCountryCodes] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const supplierId = user?.driver_id;

  const [formData, setFormData] = useState({
    supplier_id: supplierId || '',
    email: '',
    first_name: '',
    last_name: '',
    mobile_number: '',
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
      waypoint: '',
      pickup_date: '',
      passengers: '',
      luggage: '',
      distance: '',
      car_id: [],
      bid_expiry: '',
    });
  };

  const tabCounts = {
    upcoming: filteredJobs.length,
  };

  const [cars, setCars] = useState([]);

  // Fetch jobs
  useEffect(() => {
    const fetchUpcomingJobs = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }
        const [jobsData, carsData] = await Promise.all([
          upcoming_journey_details(user.driver_id, user.token),
          getAllCars(user.driver_id, user.token)
        ]);
        console.log('Jobs Data:', jobsData);
        refreshCounts();
        // Filter out duplicates
        const jobs = Array.isArray(jobsData) ? jobsData : [];
        setUpcomingJobs(jobs);
        setFilteredJobs(jobs);
        setCars(Array.isArray(carsData) ? carsData : []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingJobs();
  }, [user]);

   useEffect(() => {
      const fetchCars = async () => {
        try {
          const carsResponse = await getAllCars(supplierId, user.token);
          console.log('Raw Cars API Data:', carsResponse);
  
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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
      const matchText = (key) =>
        job[key]?.toString().toLowerCase().includes(filters[key].toLowerCase());

      const matchPostcode = (key) => {
        const input = filters[key]?.toLowerCase().trim();
        if (!input) return true;

        const value = job[key]?.toString().toLowerCase();
        const postcodeMatch = value.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);

        if (postcodeMatch) {
          const fullPostcode = postcodeMatch[0].replace(/\s+/g, '').toLowerCase();
          const prefix = fullPostcode.slice(0, input.length);
          return prefix === input;
        }

        return false;
      };

      // Convert pickup_date to ISO
      let jobDateISO = '';
      if (job.pickup_date) {
        const dt = DateTime.fromFormat(job.pickup_date, "cccc, dd LLL yyyy 'at' HH:mm", { zone: 'Europe/London' });
        jobDateISO = dt.isValid ? dt.toISODate() : '';
      }

      const dateMatch = !filters.pickup_date || jobDateISO === filters.pickup_date;
      const carMatch = !filters.car_id || filters.car_id.length === 0 || filters.car_id.includes(job.car_id);
      const fromPostcodeMatch = matchPostcode('from_address');
      const toPostcodeMatch = matchPostcode('to_address');

      return (
        (!filters.booking_ref_id || matchText('booking_ref_id')) &&
        fromPostcodeMatch &&
        toPostcodeMatch &&
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
  }, [filters, upcomingJobs]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusUpdate = async (job, status_code) => {
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


  const handleAssign = async (driver_id) => {
    const booking_journey_id = selectedJob?.booking_journey_id;
    const token = user?.token;

    if (!booking_journey_id || !token) {
      alert('Missing booking or token');
      console.log("Debug:", { booking_journey_id, token });
      return;
    }

    const fareInput = document.querySelector(`#fare_${driver_id}`);
    const fare = fareInput?.value;

    if (!fare) {
      alert('Please enter fare');
      return;
    }

    try {
      await assignDriverToJourney({
        booking_jou_id: booking_journey_id,
        driver_id,
        fare,
        token,
      });

      alert('Driver assigned successfully');
      setAssignedDriverId(driver_id); // ✅ track assigned driver
      await fetchMappedDrivers(selectedJob);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Assign failed');
    }
  };


  const handleUnassign = async (driver_id) => {
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
    }
  };
  useEffect(() => {
    const preloadCountryCodes = async () => {
      const uniqueCodes = [...new Set(upcomingJobs.map(job => job.mobile_code))];
      for (const code of uniqueCodes) {
        await getMobileCountryCode(code);
      }
    };
    if (upcomingJobs.length > 0) preloadCountryCodes();
  }, [upcomingJobs]);

  const getMobileCountryCode = async (mobile_code) => {
    if (!mobile_code || !user?.token) return '';

    if (countryCodes[mobile_code]) return countryCodes[mobile_code];

    try {
      const code = await getcountrycode(mobile_code, user.token); // returns just the code (e.g. "44")
      setCountryCodes((prev) => ({ ...prev, [mobile_code]: code }));
      return code;
    } catch (err) {
      console.error("Failed to fetch country code:", err);
      return '';
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
                <div className="col-span-full flex justify-center items-center h-64">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job, idx) => {
                      const jobKey = job.id || job.booking_journey_id || idx;
                      const status = job.icon_status ?? job.status_code;
                      return (
                        <div
                          key={jobKey}
                          className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-center mb-2">
                            {job.acknowledge_status == 1 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold mr-2">
                                Acknowledged
                              </span>
                            )}
                            <span className="text-sm text-blue-600 font-medium ml-auto"><b>Upcoming</b></span>
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
                            <div>
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-map-marker-alt text-blue-500"></i><b> Pickup:</b>
                              </span>
                              <span className="block ml-6"><b>{job.from_address}</b></span>
                            </div>
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
                            {job.flight_no && job.flight_no.trim() !== '' && (
                              <div className="flex justify-between">
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-plane text-indigo-500"></i> <b>Flight No:</b>
                                </span>
                                <span className="text-right"><b>{job.flight_no}</b></span>
                              </div>
                            )}
                            {job.arrive_from && job.arrive_from.trim() !== '' && (
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
                            {job.driver_supplier_remarks && job.driver_supplier_remarks.trim() !== '' && (
                              <div>
                                <span className="flex items-center gap-2 font-medium text-gray-600">
                                  <i className="fas fa-id-card text-blue-500"></i><b> Driver Instructions:</b>
                                </span>
                                <span className="block ml-6"><b>{job.driver_supplier_remarks}</b></span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="flex items-center gap-2 font-medium text-gray-600">
                                <i className="fas fa-calendar-alt text-blue-400"></i> <b>Fare Accepted:</b>
                              </span>
                              <span className="text-right"><b>&pound;{job.biding_amount}</b></span>
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
                                <i className="fas fa-phone-alt text-green-500"></i> <b>Mobile:</b>
                              </span>
                              <span className="text-right"><b>{`+${countryCodes[job.mobile_code] || job.mobile_code} ${job.mobile}`}</b>
                              </span>
                            </div>

                            {user.user_type === 'supplier' && (
                              <button
                                onClick={() => handleShowDriverList(job)}
                                className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded w-full mt-2"
                              >
                                Push Job To Driver
                              </button>
                            )}

                            {job.car_info && (
                              <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                                <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                                  <i className="fas fa-info-circle text-blue-500 "></i> {job.car_info}
                                </p>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                type="button"
                                disabled={
                                  status != 0 ||
                                  DateTime.fromFormat(
                                    job.pickup_date,
                                    "cccc, dd LLL yyyy 'at' HH:mm",
                                    { zone: 'Europe/London' }
                                  ).toISODate() !== DateTime.now().setZone('Europe/London').toISODate()
                                }
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
                                disabled={status != 1}
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
                                disabled={status != 2}
                                className={`flex-1 min-w-[100px] h-10 flex items-center justify-center px-4 py-2 border rounded-full transition font-semibold
                                  ${status == 3
                                    ? 'bg-green-500 text-white border-green-600'
                                    : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-700 hover:text-white'
                                  } ${status != 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                              mobile_number: '',
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
                                          >
                                            Unassign
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleAssign(driver.driver_id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                                            disabled={assignedDriverId !== null && assignedDriverId !== driver.driver_id}
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
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
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

                <div>
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

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                Add Driver
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default UpcomingJobs;
