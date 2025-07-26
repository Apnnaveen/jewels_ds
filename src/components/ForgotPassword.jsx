import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import { forgot_password_request } from '../api';
import logo from '../assets/logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [captchaValue, setCaptchaValue] = useState(null);

  const navigate = useNavigate();
  const onChange = (value) => {
    setCaptchaValue(value);
  };
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      setError('Please verify the captcha');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const token = 'your_token_here';
      await forgot_password_request(email, token);
      setMessage('Password reset link has been sent to your email.');
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.message || 'Failed to send password reset link.');
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
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">Forgot Password</h2>
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey="6LekW28rAAAAAEPx5QXzSP8HDYv_eRDik9o2zQId " // Replace with your actual site key
                onChange={onChange}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Sending...' : 'Send Email Link'}
            </button>
          </form>
          {error && <div className="mt-4 p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-600 text-center">{error}</p></div>}
          {message && <div className="mt-4 p-3 bg-green-50 rounded-lg"><p className="text-sm text-green-600 text-center">{message}</p></div>}
        </div>
      </div>
    </div>
  );
}
