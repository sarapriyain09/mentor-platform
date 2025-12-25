import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from './api';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="error">
            Invalid reset link. Please request a new password reset.
          </div>
          <p className="auth-link">
            <Link to="/forgot-password">Request Password Reset</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>🔑 Reset Password</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>
          Enter your new password
        </p>

        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            required
            placeholder="New password (at least 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-link">
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
