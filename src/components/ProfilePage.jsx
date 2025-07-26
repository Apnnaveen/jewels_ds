import React, { useEffect, useState } from 'react';
import { getUserProfile, saveSecretQuestions, getSecretQuestions } from '../api';
import Header from './MainHeader/Header';

export default function ProfilePage() {
  const user = (() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  })();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [fields, setFields] = useState([
    { question: '', answer: '' }
  ]);
  // Add a new field
  const handleAddField = () => {
    setFields([...fields, { question: '', answer: '' }]);
  };
  const handleRemoveField = (index) => {
    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    setFields(updatedFields);
  };
  // Update field value
  const handleChange = (index, key, value) => {
    const updatedFields = [...fields];
    updatedFields[index][key] = value;
    setFields(updatedFields);
  };
  const handleSubmit = async () => {
  try {
    if (!user || !user.driver_id || !user.token) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    // Only send non-empty questions
    const validFields = fields.filter(f => f.question && f.answer);
    if (validFields.length === 0) {
      setError('Please add at least one question and answer.');
      return;
    }
    await saveSecretQuestions(user.driver_id, validFields, user.token);
    setShowModal(false);
    fetchProfile(); // Optionally refresh profile
  } catch (err) {
    setError(err.message);
  }
};
const fetchQuestions = async () => {
  if (!user || !user.driver_id || !user.token) return;
  try {
    const questions = await getSecretQuestions(user.driver_id, user.token);
    setFields(questions.length ? questions.map(q => ({
      question: q.question,
      answer: q.answer
    })) : [{ question: '', answer: '' }]);
  } catch (err) {
    // Optionally handle error
  }
};

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user || !user.driver_id || !user.token) {
        setError('User not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      const data = await getUserProfile(user.driver_id, user.token);
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleShowModal = () => {
    setShowModal(true);
  }
  const handleCloseModal = () => {
    setShowModal(false);

  };
 useEffect(() => {
  fetchProfile();
  fetchQuestions();
}, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg text-gray-600 font-medium">Loading your profile...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchProfile}
          className="mt-6 px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <div className="text-yellow-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Profile Found</h2>
        <p className="text-gray-600">We couldn't retrieve your profile information.</p>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">{profile.firstname} {profile.lastname}</h2>
            </div>
            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 3M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-medium text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-medium text-gray-900">{profile.mob}</p>
                </div>
              </div>
              {/* <div className="p-2 rounded-lg flex items-center">

                <div className="ml-4">
                  <button onClick={() => handleShowModal()}
                    className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white  focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800">
                    <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-white-900  rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                      Add Questions
                    </span>
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Add Questions</h2>
            {fields.map((field, index) => (
              <div key={index} className="mb-4 p-4 border rounded-lg relative bg-gray-50">
                <label className="block mb-1 font-medium">Question {index + 1}</label>

                <input
                  key={index}
                  value={field.question}
                  onChange={(e) => handleChange(index, 'question', e.target.value)}
                  placeholder={`Field ${index + 1}`}
                  className="mb-2 block w-full px-3 py-2 border rounded"
                  required
                />
                <label className="block mb-1 font-medium">Answer</label>
                <input
                  type="text"
                  placeholder="Answer (1-2 words)"
                  value={field.answer}
                  onChange={(e) => handleChange(index, 'answer', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-400"
                  required
                />
                {fields.length > 1 && (
                  <button
                    onClick={() => handleRemoveField(index)}
                    className="absolute top-2 right-2 text-sm text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                  // <button
                  //   onClick={() => {/* handle edit logic here */}}
                  //   className="absolute top-2 left-2 text-sm text-blue-500 hover:text-blue-700"
                  // >
                  //   Edit
                  // </button>
                )}
              </div>
            ))}
            {fields.length < 3 && (
              <button
                onClick={handleAddField}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Field
              </button>)}
            <div className="mt-4 flex justify-end">
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Submit
              </button>
            </div>
          </div>
        </div>

      )}
    </>
  );
}
