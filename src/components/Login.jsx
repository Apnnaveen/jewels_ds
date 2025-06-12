import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api';
import './css/Login.css';
import logo from '../assets/logo.png'; // Add your logo path

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard', { state: { user: data } });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Jewels Airport Transfers</h2>
      <img src={logo} alt="Logo" />
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Login</button>
        <div style={{ marginTop: '10px' }}>
          <Link
            to="/forgot-password"
            style={{ color: '#1976d2', textDecoration: 'underline', fontSize: '0.95rem' }}
          >
            Forgot Password?
          </Link>
        </div>
      </form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}