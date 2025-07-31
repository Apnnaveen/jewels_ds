import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verify_otp_password } from '../api';
import logo from '../assets/logo.png';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await verify_otp_password(email, otp);
      setMessage('OTP verified successfully!');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 py-6 px-8 text-center">
          <img src={logo} alt="Logo" className="mx-auto h-24 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">JEWELS AIRPORT TRANSFERS</h1>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Verify OTP</h2>
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter the OTP sent"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-600 text-center">{error}</p></div>}
          {message && <div className="mt-4 p-3 bg-green-50 rounded-lg"><p className="text-sm text-green-600 text-center">{message}</p></div>}
        </div>
      </div>
    </div>
  );
}
