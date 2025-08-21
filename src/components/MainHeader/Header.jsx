import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logoutStatus, fetchAvailableJobs, scheduled_journey_details, getUserNotificationStates } from '../../api';
export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeItem, setActiveItem] = useState('dashboard');
    const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
    const [notificationCount, setNotificationCount] = useState(0);
    const [scheduledNotificationCount, setScheduledNotificationCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser?.driver_id && localUser?.token) {
                try {
                    const [
                        jobs,
                        notificationSeen
                    ] = await Promise.all([
                        fetchAvailableJobs(localUser.driver_id, localUser.token),
                        getUserNotificationStates(localUser.driver_id, localUser.token)
                    ]);

                    const bookingIds = jobs.map(job => job.booking_journey_id.toString());
                    const availableSeen = notificationSeen.availableSeen;

                    const newUnseen = bookingIds.filter(id => !availableSeen.includes(id));

                    setNotificationCount(newUnseen.length);

                } catch (err) {
                    console.error('Failed to fetch notifications', err);
                }
            }
        };

        fetchNotifications();

        const handleSeenUpdate = () => fetchNotifications();
        window.addEventListener('userSeenUpdated', handleSeenUpdate);

        return () => {
            window.removeEventListener('userSeenUpdated', handleSeenUpdate);
        };
    }, []);

    useEffect(() => {
        const fetchScheduledNotifications = async () => {
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser?.driver_id && localUser?.token) {
                try {
                    const [
                        scheduledJobs,
                        notificationSeen
                    ] = await Promise.all([
                        scheduled_journey_details(localUser.driver_id, localUser.token),
                        getUserNotificationStates(localUser.driver_id, localUser.token)
                    ]);

                    const bookingIds = scheduledJobs.map(job => job.booking_journey_id.toString());
                    const scheduledSeen = notificationSeen.scheduledSeen;

                    const newUnseen = bookingIds.filter(id => !scheduledSeen.includes(id));
                    setScheduledNotificationCount(newUnseen.length);
                } catch (err) {
                    console.error('Scheduled notification error:', err);
                }
            }
        };


        fetchScheduledNotifications();

        const listener = () => {
            fetchScheduledNotifications();
        };

        window.addEventListener('userScheduledSeenUpdated', listener);
        return () => {
            window.removeEventListener('userScheduledSeenUpdated', listener);
        };
    }, []);




    useEffect(() => {
        if (location.pathname.includes('profile')) {
            setActiveItem('profile');
        } else if (location.pathname.includes('dashboard')) {
            setActiveItem('dashboard');
        }
        else if (location.pathname.includes('driverlist')) {
            setActiveItem('driverlist');
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        const user = JSON.parse(localStorage.getItem('user'));

        if (user && user.email) {
            await logoutStatus(user.email); // or 'app' if from mobile
        }

        localStorage.removeItem('user');
        navigate('/');
    };

    useEffect(() => {
        const id = 'fontawesome-cdn';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        }
    }, []);

    const menuItems = [
        { key: 'dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { key: 'profile', icon: 'fas fa-user', label: 'Profile' },
    ];
    if (user?.user_type === 'supplier') {
        menuItems.push({ key: 'driverlist', icon: 'fas fa-users', label: 'Driver List' });
    }
    const handleMenuClick = (key) => {
        setActiveItem(key);
        setMenuOpen(false);
        navigate(`/${key}`, { state: { user } });
    };

    return (
        <nav className="bg-gray-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo or Title */}
                    <div className="flex items-center space-x-4">
                        {/* Profile Icon */}
                        <div className="text-white">
                            <i className="fas fa-user-circle fa-2x"></i>
                        </div>
                        <button
                            onClick={() => navigate('/notification', { state: { user } })}
                            className="relative flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition"
                        >
                            <i className="fas fa-bell"></i>
                            {(notificationCount + scheduledNotificationCount > 0) && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                                    {notificationCount + scheduledNotificationCount}
                                </span>
                            )}


                        </button>
                        {/* Profile Info */}
                        <div className="md:flex flex-col leading-tight">
                            <h3 className="text-sm font-medium">{user?.name}</h3>
                            <p className="text-xs text-gray-300">{user?.email}</p>
                        </div>
                    </div>



                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-6 items-center">
                        {menuItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => handleMenuClick(item.key)}
                                className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition ${activeItem === item.key ? 'bg-gray-700' : ''
                                    }`}
                            >
                                <i className={item.icon}></i> {item.label}
                            </button>
                        ))}
                        <button className='rounded px-3 py-2 hover:bg-gray-700'><a target='_blank' href="https://jat-uk.com/instructions-and-terms">T & C</a></button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded hover:bg-red-600 transition"
                        >
                            <i className="fas fa-sign-out-alt"></i> Sign Out
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setMenuOpen(!menuOpen)}>
                            <i className="fas fa-bars text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="md:hidden bg-gray-800 px-4 py-3 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => handleMenuClick(item.key)}
                            className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-700 ${activeItem === item.key ? 'bg-gray-700' : ''
                                }`}
                        >
                            <i className={`${item.icon} mr-2`}></i> {item.label}
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 rounded hover:bg-red-600"
                    >
                        <i className="fas fa-sign-out-alt mr-2"></i> Sign Out
                    </button>
                </div>
            )}
        </nav>
    );
}
