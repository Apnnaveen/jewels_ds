import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';
import ReCAPTCHA from "react-google-recaptcha";
import { forgot_password_request, verify_login } from '../api'; // Adjust the import path as necessary
import logo from '../assets/logo.png';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);
  const navigate = useNavigate();

  const handleforgot_password_request = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await forgot_password_request(email);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleverify_login = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      setError('Please verify the captcha');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      
      const data = await verify_login(email, otp);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      navigate('/dashboard', { state: { user: data } });
    } catch (err) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaValue) {
      setError('Please verify the captcha');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard', { state: { user: data } });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChange = (value) => {
    setCaptchaValue(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-indigo-600 py-6 px-8 text-center">
          <img src={logo} alt="Logo" className="mx-auto h-24 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">JEWELS AIRPORT TRANSFERS</h1>
        </div>


        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            {otpSent ? 'Verify OTP' : 'Login'}
          </h2>

          {/* <form onSubmit={otpSent ? handleverify_login : handleforgot_password_request} className="space-y-5"> */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm --medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
            </div>
            {otpSent && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter your OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            {/* Note Section */}
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md border-l-4 border-yellow-500">
              <p>
                If you don’t remember your password or didn’t set it up, click on{' '}
                <Link to="/forgot-password" className="text-indigo-600 font-medium hover:underline">
                  Forgot password
                </Link>{' '}
                and create a new password.
              </p>
            </div>
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey="6LekW28rAAAAAEPx5QXzSP8HDYv_eRDik9o2zQId " // Replace with your actual site key
                onChange={onChange}
              />
            </div>

            {/* <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {otpSent ? 'Verifying...' : 'Sending OTP...'}
                </>
              ) : otpSent ? (
                'Verify OTP'
              ) : (
                'Send OTP'
              )}
            </button> */}
            <button type="submit" className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 `} >
              Login
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
