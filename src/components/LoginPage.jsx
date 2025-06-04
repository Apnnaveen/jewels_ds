import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api'; // 🟡 Make sure this is correctly imported

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ handleSubmit goes here
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password) {  
      setMessage('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email, password); // 🔁 This calls the API

      // Save token and driver_id in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('driver_id', data.driver_id);
      localStorage.setItem('name', data.name);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Driver Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter email"
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Password:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && <p style={{ marginTop: 20, color: 'red' }}>{message}</p>}
    </div>
  );
}
