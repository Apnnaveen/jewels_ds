import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './MainHeader/Header';
import {
    fetchAvailableJobs,
    updateUserSeen,
    getUserNotificationStates
} from '../api';

export default function Notification() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

    const [unseenAvailable, setUnseenAvailable] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchUnseenJobs = async () => {
            try {
                const [availableJobs, notificationSeen] = await Promise.all([
                    fetchAvailableJobs(user.driver_id, user.token),
                    getUserNotificationStates(user.driver_id, user.token)
                ]);

                const availableSeen = notificationSeen.availableSeen;

                if (!isMounted) return;

                const unseenAvail = availableJobs.filter(job =>
                    !availableSeen?.includes(job.booking_journey_id.toString())
                );

                setUnseenAvailable(unseenAvail);
            } catch (error) {
                console.error('Failed to fetch unseen jobs:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchUnseenJobs();

        return () => {
            isMounted = false;
        };
    }, [user]);

    useEffect(() => {
        return () => {
            const markAsSeen = async () => {
                try {
                    const { availableSeen } = await getUserNotificationStates(user.driver_id, user.token);
                    const newSeenAvail = unseenAvailable.map(job => job.booking_journey_id.toString());
                    const updatedAvailable = [...new Set([...availableSeen, ...newSeenAvail])];

                    await updateUserSeen(user.driver_id, updatedAvailable, user.token);
                    window.dispatchEvent(new Event('userSeenUpdated'));
                } catch (error) {
                    console.error('Error marking notifications as seen:', error);
                }
            };

            if (unseenAvailable.length > 0) {
                markAsSeen();
            }
        };
    }, [unseenAvailable]);

    return (
        <>
            <Header />

            <div className="min-h-screen bg-gray-100 py-10">
                <div className="max-w-2xl mx-auto px-4">
                    <h2 className="text-xl font-semibold mb-6">Notifications</h2>

                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 text-sm text-blue-600 hover:underline flex items-center"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Loading notifications...</div>
                    ) : (
                        <>
                            {unseenAvailable.map((job, index) => (
                                <div key={`a-${index}`} className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 p-4">
                                    <div className="flex items-start">
                                        <div className="bg-purple-100 text-purple-600 p-2 rounded-full mr-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-purple-700 mb-1">New Booking Available</h4>
                                            <p className="text-sm text-gray-700"><strong>Booking Ref:</strong> {job.booking_ref_id}</p>
                                            <p className="text-sm text-gray-700"><strong>From:</strong> {job.from_address}</p>
                                            <p className="text-sm text-gray-700"><strong>To:</strong> {job.to_address}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
