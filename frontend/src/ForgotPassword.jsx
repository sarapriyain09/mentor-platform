import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from './api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.detail || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🔐 Forgot Password</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>
          Enter your email and we'll send you a reset link
        </p>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-link">
          Remember your password? <Link to="/login">Login</Link>
        </p>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
