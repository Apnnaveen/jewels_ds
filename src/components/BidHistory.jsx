import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JobsTabs from './JobsTabs';
import { bid_history } from '../api';
import './css/Available.css';

const BidHistory = () => {
    const [bidHistory, setBidHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = location.state || {};

    useEffect(() => {
        // Redirect if user info is missing
        if (!user || !user.driver_id || !user.token) {
            navigate('/login');
            return;
        }

        const fetchBidHistory = async () => {
            try {
                const response = await bid_history(user.driver_id, user.token);
                // console.log("Raw Bid History API response:", response);

                // ✅ response itself is the array
                const historyData = Array.isArray(response)
                    ? response
                    : [];

                setBidHistory(historyData);
                // console.log("Extracted Bid History:", historyData);
            } catch (error) {
                console.error('Error fetching bid history:', error);
            } finally {
                setLoading(false);
            }
        };


        fetchBidHistory();
    }, [user, navigate]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="bid-history-container">
            <JobsTabs activeTab="bid" user={user} />
            <h2>Bid History</h2>
            {Array.isArray(bidHistory) && bidHistory.length > 0 ? (
                <table className="bid-history-table">
  <thead>
    <tr>
      <th>Booking ref id</th>
      <th>Bid Amount</th>
    </tr>
  </thead>
  <tbody>
    {bidHistory.map((bid, index) => (
      <tr key={bid.id || index}>
        <td>{bid.booking_ref_id}</td>
        <td>{bid.biding_amount}</td>
      </tr>
    ))}
  </tbody>
</table>

            ) : (
                <p>No bid history available.</p>
            )}
        </div>
    );
};

export default BidHistory;
