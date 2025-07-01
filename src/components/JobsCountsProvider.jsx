import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    fetchAvailableJobs,
    bid_history,
    scheduled_journey_details,
    tomorrow_journeys,
    upcoming_journey_details,
    completed_journeys
} from '../api';

const JobsCountsContext = createContext();

export const useJobsCounts = () => useContext(JobsCountsContext);

export const JobsCountsProvider = ({ user, children }) => {
    const [counts, setCounts] = useState({
        available: 0,
        bid: 0,
        scheduled: 0,
        tomorrow: 0,
        upcoming: 0,
        completed: 0,
    });
    const [loading, setLoading] = useState(true);


    const fetchCounts = async () => {
        setLoading(true);
        try {
            const [
                available,
                bid,
                scheduled,
                tomorrow,
                upcoming,
                completed
            ] = await Promise.all([
                fetchAvailableJobs(user.driver_id, user.token),
                bid_history(user.driver_id, user.token),
                scheduled_journey_details(user.driver_id, user.token),
                tomorrow_journeys(user.driver_id, user.token),
                upcoming_journey_details(user.driver_id, user.token),
                completed_journeys(user.driver_id, user.token)
            ]);
            setCounts({
                available: Array.isArray(available) ? available.length : 0,
                bid: Array.isArray(bid) ? bid.length : 0,
                scheduled: Array.isArray(scheduled) ? scheduled.length : 0,
                tomorrow: Array.isArray(tomorrow) ? tomorrow.length : 0,
                upcoming: Array.isArray(upcoming) ? upcoming.length : 0,
                completed: Array.isArray(completed) ? completed.length : 0,
            });

        } catch {
            setCounts({
                available: 0, bid: 0, scheduled: 0, tomorrow: 0, upcoming: 0, completed: 0
            });
        }
        setLoading(false);
    };
    useEffect(() => {
        if (!user?.driver_id || !user?.token) return;
        fetchCounts();
    }, [user]);
    return (
        <JobsCountsContext.Provider value={{ counts, loading, refreshCounts: fetchCounts }}>
            {children}
        </JobsCountsContext.Provider>
    );
};