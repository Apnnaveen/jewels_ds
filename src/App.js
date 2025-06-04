import React, { useState } from 'react';
import './App.css';
import { loginUser } from './api'; // ✅ Make sure path is correct

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email || !password) {
      setMessage('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(email, password);

      // ✅ Save login info
      localStorage.setItem('token', data.token);
      localStorage.setItem('driver_id', data.driver_id);
      localStorage.setItem('name', data.name);

      window.location.href = '/dashboard';
      // You can also redirect to another page here (like dashboard)
    } catch (err) {
      setMessage(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          placeholder="Enter email"
          onChange={e => setEmail(e.target.value)}
        />
        <label>Password:</label>
        <input
          type="password"
          value={password}
          placeholder="Enter password"
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default App;
