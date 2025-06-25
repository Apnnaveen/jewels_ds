// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { add_driver } from '../api';
// import Header from './MainHeader/Header';
// import Loading from './Loading/Loading';
// import { DateTime } from 'luxon';
// const AddDriver = () => {
//     const navigate = useNavigate();
//     const [actionLoading, setActionLoading] = useState(false);
//     const [sidebarOpen, setSidebarOpen] = useState(true); // Change default if needed

//     const storedUser = localStorage.getItem('user');
//     const user = storedUser ? JSON.parse(storedUser) : null;

//     const token = user?.token;
//     const supplierId = user?.driver_id;

//     const [formData, setFormData] = useState({
//         supplier_id: supplierId || '',
//         email: '',
//         first_name: '',
//         last_name: '',
//         mobile_number: '',
//         vehicle: '',
//         car_reg: '',      // instead of car_registration
//         make: '',         // instead of make_and_model
//         v_color: '',      // instead of vehicle_colour
//         member_type: 'subs',
//     });


//     if (!user || !supplierId || !token) {
//         return <div className="text-red-500 text-center">User not found or invalid. Please log in.</div>;
//     }

//     const handleChange = (e) => {
//         setFormData((prev) => ({
//             ...prev,
//             [e.target.name]: e.target.value,
//         }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         let requiredFields = [
//             'supplier_id',
//             'first_name',
//             'last_name',
//             'email',
//             'mobile_number',
//             'vehicle_type',
//             'car_registration',
//             'make_and_model',
//             'vehicle_colour',
//         ];

//         const emptyField = requiredFields.find((field) => !formData[field]);
//         if (emptyField) {
//             alert(`Please fill in the ${emptyField.replace('_', ' ')}`);
//             return;
//         }

//         setActionLoading(true); // Show loader
//         try {
//             await add_driver(formData, token);
//             alert('Driver added successfully!');
//             window.location.reload();
//         } catch (error) {
//             alert(error.message || 'Failed to add driver.');
//         } finally {
//             setActionLoading(false); // Hide loader
//         }
//     };


//     const vehicleTypes = [
//         { label: 'Saloon', value: 'saloon' },
//         { label: 'Estate', value: 'estate' },
//         { label: 'Executive Car', value: 'executive_car' },
//         { label: 'Maruti', value: 'maruti' },
//         { label: 'People Carrier', value: 'people_carrier' },
//         { label: '8 Seater', value: '8_seater' },
//         { label: 'Coach', value: 'coach' },
//     ];

//     return (
//         <>
//             <Header />
//             {actionLoading && (
//                 <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
//                     <div className="bg-white p-4 rounded-lg shadow-lg">
//                         <Loading />
//                     </div>
//                 </div>
//             )}
//             <div className="dashboard-layout mx-5 mt-5">
//                 <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
//                     <div className="w-full">
//                         <div className="w-full max-w-4xl mx-auto bg-white shadow-md rounded-md p-6 mt-6">
//                             <h2 className="text-2xl font-semibold mb-4 text-center">Add Driver</h2>
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 {/* Top Row: Member Type */}
//                                 <div className="flex justify-between items-center">
//                                     <div></div>
//                                     <div>
//                                         <label className="block font-semibold text-sm text-gray-700 mb-1">Member Type <span className="text-red-500">*</span></label>
//                                         <div className="flex items-center">
//                                             <input
//                                                 type="radio"
//                                                 id="subs"
//                                                 name="member_type"
//                                                 value="subs"
//                                                 checked
//                                                 disabled
//                                                 className="mr-2"
//                                             />
//                                             <label htmlFor="subs">Subs</label>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Name & Contact */}
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div>
//                                         <label className="block font-medium mb-1">First Name <span className="text-red-500">*</span></label>
//                                         <input
//                                             type="text"
//                                             name="first_name"
//                                             value={formData.first_name}
//                                             onChange={handleChange}
//                                             className="w-full border border-gray-300 rounded px-3 py-2"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block font-medium mb-1">Last Name <span className="text-red-500">*</span></label>
//                                         <input
//                                             type="text"
//                                             name="last_name"
//                                             value={formData.last_name}
//                                             onChange={handleChange}
//                                             className="w-full border border-gray-300 rounded px-3 py-2"
//                                         />
//                                     </div>

//                                     <div>
//                                         <label className="block font-medium mb-1">Email <span className="text-red-500">*</span></label>
//                                         <input
//                                             type="email"
//                                             name="email"
//                                             value={formData.email}
//                                             onChange={handleChange}
//                                             className="w-full border border-gray-300 rounded px-3 py-2"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block font-medium mb-1">Mobile Number <span className="text-red-500">*</span></label>
//                                         <input
//                                             type="tel"
//                                             name="mobile_number"
//                                             value={formData.mobile_number}
//                                             onChange={handleChange}
//                                             className="w-full border border-gray-300 rounded px-3 py-2"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Vehicle Section */}
//                                 <div>
//                                     <h3 className="text-xl font-semibold mb-3 border-b pb-1">Vehicle Details</h3>

//                                     <div className="mb-3">
//                                         <label className="block font-medium mb-2">Vehicle <span className="text-red-500">*</span></label>
//                                         <div className="flex flex-wrap gap-4">
//                                             {vehicleTypes.map((vehicle) => (
//                                                 <label key={vehicle.value} className="inline-flex items-center">
//                                                     <input
//                                                         type="radio"
//                                                         name="vehicle_type"
//                                                         value={vehicle.value}
//                                                         checked={formData.vehicle_type === vehicle.value}
//                                                         onChange={handleChange}
//                                                         className="mr-2"
//                                                     />
//                                                     {vehicle.label}
//                                                 </label>
//                                             ))}
//                                         </div>
//                                     </div>

//                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                         <div>
//                                             <label className="block font-medium mb-1">Car Reg <span className="text-red-500">*</span></label>
//                                             <input
//                                                 type="text"
//                                                 name="car_registration"
//                                                 value={formData.car_registration}
//                                                 onChange={handleChange}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block font-medium mb-1">Make and Model <span className="text-red-500">*</span></label>
//                                             <input
//                                                 type="text"
//                                                 name="make_and_model"
//                                                 value={formData.make_and_model}
//                                                 onChange={handleChange}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2"
//                                             />
//                                         </div>
//                                         <div>
//                                             <label className="block font-medium mb-1">Vehicle Colour <span className="text-red-500"></span></label>
//                                             <input
//                                                 type="text"
//                                                 name="vehicle_colour"
//                                                 value={formData.vehicle_colour}
//                                                 onChange={handleChange}
//                                                 className="w-full border border-gray-300 rounded px-3 py-2"
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <button
//                                     type="submit"
//                                     className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
//                                 >
//                                     Add Driver
//                                 </button>
//                             </form>

//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default AddDriver;
