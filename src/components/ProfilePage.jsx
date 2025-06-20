import React, { useEffect, useState } from 'react';
import { getUserProfile } from '../api';
import Header from './MainHeader/Header';

export default function ProfilePage() {
  // Get user from localStorage
  const user = (() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  })();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !user.driver_id || !user.token) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(user.driver_id, user.token);
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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
          onClick={() => window.location.reload()}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6">
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold mr-4 shadow-lg ring-4 ring-white">
                  {profile.firstname?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{profile.firstname} {profile.lastname}</h1>
                  <p className="text-indigo-100">{profile.email}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Personal Information</h3>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="text-lg font-medium text-gray-900">{profile.firstname} {profile.lastname}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-lg font-medium text-gray-900">{profile.mob}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
