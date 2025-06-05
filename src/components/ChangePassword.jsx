import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { updatePassword } from '../api'; // Import the API function
import './css/ChangePassword.css';

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const location = useLocation();
    const { user } = location.state || {};

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage('New passwords do not match.');
            return;
        }

        if (!user || !user.driver_id || !user.token) {
            setMessage('User information is missing. Please log in again.');
            return;
        }

        try {
            await updatePassword(
                user.driver_id,
                user.token,
                currentPassword,
                newPassword,
                confirmPassword
            );
            setMessage('Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <div className="change-password-container">
            <h2>Change Password</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                    <label>New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div>
                    <label>Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit">Update Password</button>
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );
}