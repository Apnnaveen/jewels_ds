import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getUserProfile } from '../api'; // Import the API function
import './css/ProfilePage.css';

export default function ProfilePage() {
  const location = useLocation();
  const { user } = location.state || {};

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

  if (loading) return <div className="profile-container">Loading profile...</div>;
  if (error) return <div className="profile-container error">{error}</div>;
  if (!profile) return <div className="profile-container error">Profile data not available.</div>;

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      <div className="profile-info">
        <p><strong>Name:</strong> {profile.firstname}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Phone:</strong> {profile.mob}</p>
        {/* <p><strong>Driver ID:</strong> {profile.driver_id}</p> */}
        <p><strong>Address:</strong> {profile.address1}</p>
        <p><strong>Member type:</strong> {profile.customer_type}</p>
      </div>
    </div>
  );
}