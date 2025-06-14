import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { scheduled_journey_details } from '../api'; // adjust path if needed
import './css/Available.css'; // reuse if styling is common

const ScheduledJobs = () => {
  const location = useLocation();
  const user = location.state?.user;

  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScheduledJobs = async () => {
      try {
        if (!user?.driver_id || !user?.token) {
          setError('User not authenticated');
          return;
        }

        const data = await scheduled_journey_details(user.driver_id, user.token);
        setScheduledJobs(data);
        console.log(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledJobs();
  }, [user]);

  return (
    <div className="jobs-container">
      <JobsTabs activeTab="scheduled" user={user} />
      <div className="jobs-content">
        {loading ? (
          <p>Loading scheduled jobs...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : scheduledJobs.length === 0 ? (
          <p>No scheduled jobs available.</p>
        ) : (
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Booking Ref Id</th>
                <th>from_address</th>
                <th>To_address</th>
                <th>Pickup Date</th>
              </tr>
            </thead>
            <tbody>
              {scheduledJobs.map((job, index) => (
                <tr key={job.id || index}>
                  <td>{job.booking_ref_id}</td>
                  <td>{job.from_address}</td>
                  <td>{job.to_address}</td>
                  <td>{job.pickup_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ScheduledJobs;
