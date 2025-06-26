import React, { useEffect, useState } from 'react';
import { get_driver_details, add_driver, save_supplier_driver, get_supplier_details, delete_driver, getAllCars } from '../api';
import Header from './MainHeader/Header';
import Loading from './Loading/Loading';

const DriverList = () => {
  const [supplierDrivers, setSupplierDrivers] = useState([]);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDriverId, setEditDriverId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = user?.token;
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

  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const response = await get_driver_details(supplierId, token);
        if (response.data?.supplier_driver_names) {
          setSupplierDrivers(response.data.supplier_driver_names);
          setMessage('');
        } else {
          setMessage('No drivers found.');
        }
      } catch (error) {
        setMessage(error.message || 'Failed to fetch drivers.');
      }
    };

    fetchDriverData();
  }, [supplierId, token]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const carsResponse = await getAllCars(supplierId, token);
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
  }, [token, supplierId]);

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

      if (isEditing && editDriverId) {
        submitData.driver_id = editDriverId;
        console.log("Submitting to save_supplier_driver:", submitData);
        await save_supplier_driver(submitData, token);
        alert('Driver updated successfully!');
      } else {
        // Add new driver
        await add_driver(submitData, token);
        alert('Driver added successfully!');
      }

      setModalOpen(false);
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };


  const handleEditClick = async (driverId) => {
    try {
      const response = await get_supplier_details(driverId, token);
      console.log('Driver edit response:', response);

      const driverData = response?.driver;
      if (driverData) {
        setFormData({
          supplier_id: driverData.supplier_id || '',
          email: driverData.email || '',
          first_name: driverData.firstname || '',
          last_name: driverData.lastname || '',
          mobile_number: driverData.mob || '',
          vehicle: driverData.vehicle || '',
          car_reg: driverData.car_reg || '',
          make: driverData.make || '',
          vehicle_colour: driverData.v_color || '',
          member_type: driverData.customer_type || 'subs',
        });

        setEditDriverId(driverId);
        setIsEditing(true);
        setIsEditMode(true);
        setModalOpen(true);
      } else {
        alert('Driver not found');
      }
    } catch (error) {
      console.error('Edit fetch error:', error);
      alert(error.message || 'Failed to fetch driver');
    }
  };

  const handleDeleteClick = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;

    try {
      await delete_driver(driverId, token);
      alert('Driver deleted successfully!');
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Failed to delete driver');
    }
  };

  return (
    <>
      <Header />

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Driver List</h1>
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
              setIsEditing(false);
              setEditDriverId(null);
              setIsEditMode(false);
              setModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            <i className="fas fa-plus mr-2"></i> Add Driver
          </button>
        </div>

        {message ? (
          <p className="text-gray-600 text-center">{message}</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Driver Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {supplierDrivers.map((driver, index) => (
                  <tr key={index}>
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{driver.name}</td>
                    <td className="px-6 py-3">{driver.email}</td>
                    <td className="px-6 py-3 text-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditClick(driver.driver_id);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteClick(driver.driver_id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => {
                setModalOpen(false);
                setIsEditing(false);
                setEditDriverId(null);
                setIsEditMode(false);
              }}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              {isEditing ? 'Edit Driver' : 'Add Driver'}
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
                    disabled={isEditMode}
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
                    disabled={isEditMode}
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
                {actionLoading ? (isEditing ? 'Updating...' : 'Adding...') : isEditing ? 'Update Driver' : 'Add Driver'}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
};

export default DriverList;
