import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import JobsTabs from './JobsTabs';
import { bid_history } from '../api';
import './css/Available.css';
import './css/Dashboard.css';

const BidHistory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('bid');
  const [bidHistory, setBidHistory] = useState([]);
  const [filteredBids, setFilteredBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    booking_ref_id: '',
    biding_amount: '',
    pickup_date: '',
    from_address: '',
    to_address: '',
    pickup_date_from: '',
    pickup_date_to: ''
  });

  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user?.driver_id || !user?.token) {
      navigate('/login');
      return;
    }

    const fetchBidHistory = async () => {
      try {
        const response = await bid_history(user.driver_id, user.token);
        const data = Array.isArray(response) ? response : [];
        setBidHistory(data);
        setFilteredBids(data);
      } catch (error) {
        console.error('Error fetching bid history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [user, navigate]);

  useEffect(() => {
    const filtered = bidHistory.filter((item) => {
      const match = (field) =>
        filters[field] === '' ||
        (item[field] && item[field].toString().toLowerCase().includes(filters[field].toLowerCase()));

      const inDateRange = () => {
        const itemDate = new Date(item.pickup_date);
        const from = filters.pickup_date_from ? new Date(filters.pickup_date_from) : null;
        const to = filters.pickup_date_to ? new Date(filters.pickup_date_to) : null;

        return (
          (!from || itemDate >= from) &&
          (!to || itemDate <= to)
        );
      };

      return (
        match('booking_ref_id') &&
        match('biding_amount') &&
        match('from_address') &&
        match('to_address') &&
        inDateRange()
      );
    });

    setFilteredBids(filtered);
  }, [filters, bidHistory]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <button className="global-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <i className="fas fa-bars"></i>
      </button>

      <div className="dashboard-layout">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          open={sidebarOpen}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
        />

        <div className={`dashboard-main${sidebarOpen ? '' : ' centered'}`}>
          <JobsTabs activeTab="bid" user={user} />
          <h2>Bid History</h2>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="jobs-content">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Booking Ref ID</th>
                    <th>Bid Amount</th>
                    <th>Pickup Date</th>
                    <th>From Address</th>
                    <th>To Address</th>
                  </tr>
                  <tr>
                    <th>
                      <input
                        type="text"
                        name="booking_ref_id"
                        placeholder="Filter"
                        value={filters.booking_ref_id}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        name="biding_amount"
                        placeholder="Filter"
                        value={filters.biding_amount}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </th>
                    <th>
                      <input
                        type="date"
                        name="pickup_date_from"
                        value={filters.pickup_date_from}
                        onChange={handleFilterChange}
                        className="filter-input"
                        style={{ marginBottom: '5px' }}
                      />
                      <input
                        type="date"
                        name="pickup_date_to"
                        value={filters.pickup_date_to}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        name="from_address"
                        placeholder="Filter"
                        value={filters.from_address}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        name="to_address"
                        placeholder="Filter"
                        value={filters.to_address}
                        onChange={handleFilterChange}
                        className="filter-input"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBids.length > 0 ? (
                    filteredBids.map((bid, index) => (
                      <tr key={bid.id || index}>
                        <td>{bid.booking_ref_id}</td>
                        <td>{bid.biding_amount}</td>
                        <td>{bid.pickup_date}</td>
                        <td>{bid.from_address}</td>
                        <td>{bid.to_address}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5">No matching bid history found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BidHistory;
