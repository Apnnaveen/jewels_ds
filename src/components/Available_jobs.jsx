import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const AvailableJobs = () => {
    const location = useLocation();
    const [jobs, setJobs] = useState([]);
    const user = location.state?.user;

    useEffect(() => {
        if (user?.driver_id && user?.token) {
            const fetchJobs = async () => {
                try {
                    const response = await fetch(
                        `http://jewels_prod.com/api/users/available_jobs/${user.driver_id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${user.token}`,
                            },
                        }
                    );
                    if (!response.ok) throw new Error('Failed to fetch jobs');
                    const data = await response.json();
                    // Adjust this based on the actual structure of your API response
                    const jobsArray = Array.isArray(data.data) ? data.data : [];
                    setJobs(jobsArray);
                } catch (error) {
                    console.error(error);
                    setJobs([]);
                }
            };
            fetchJobs();
        } else {
            setJobs([]);
        }
    }, [user]);

    const [showJobs, setShowJobs] = useState(false);

    return (
        <div>
            <button onClick={() => setShowJobs((prev) => !prev)}>
                {showJobs ? 'Hide Available Jobs' : 'Show Available Jobs'}
            </button>
            {showJobs && (
                <div>
                    <h1>Available Jobs</h1>
                    {jobs && jobs.length > 0 ? (
                        <ul>
                            {jobs.map((job, idx) => (
                                <li
                                    key={job.booking_id || idx}
                                    style={{
                                        marginBottom: '1.5em',
                                        borderBottom: '1px solid #ccc',
                                        paddingBottom: '1em',
                                    }}
                                >
                                    <strong>Booking Ref:</strong> {job.booking_ref_id}<br />
                                    <strong>From:</strong> {job.from_address}<br />
                                    <strong>To:</strong> {job.to_address}<br />
                                    <strong>Pickup Date:</strong> {job.pickup_date}<br />
                                    <strong>Passengers:</strong> {job.passengers}<br />
                                    <strong>Luggage:</strong> {job.luggage}<br />
                                    <strong>Distance:</strong> {job.distance}<br />
                                    <strong>Car Info:</strong> {job.car_info}<br />
                                    <strong>Bid Expiry:</strong> {job.bid_expiry_date} at {job.bid_expiry_time}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No jobs available</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AvailableJobs;
