import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './Dashboard.css';

export default function MenteeDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      // Fetch bookings
      const bookingsRes = await fetch(`${API_BASE}/bookings/my-bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        const now = new Date();
        
        // Split into upcoming and past
        const booked = bookings.filter(b => new Date(b.slot_start_time) > now && b.status !== 'cancelled');
        const past = bookings.filter(b => new Date(b.slot_start_time) <= now || b.status === 'cancelled');
        
        setBookedSessions(booked);
        setPastSessions(past);
        
        // Calculate total spent
        const total = bookings
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);
        setTotalSpent(total);
      }
      
      // Fetch payment history
      const paymentsRes = await fetch(`${API_BASE}/payments/my-payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (paymentsRes.ok) {
        const payments = await paymentsRes.json();
        setPaymentHistory(payments);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard mentee-dashboard">
      <div className="dashboard-header">
        <h1>Mentee Dashboard</h1>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/ai-match')} 
            className="btn-ai"
          >
            🤖 AI Mentor Match
          </button>
          <button 
            onClick={() => navigate('/mentors')} 
            className="btn-primary"
          >
            Browse Mentors
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{bookedSessions.length}</div>
          <div className="stat-label">Upcoming Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{pastSessions.filter(s => s.status === 'confirmed').length}</div>
          <div className="stat-label">Completed Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-value">{formatCurrency(totalSpent)}</div>
          <div className="stat-label">Total Spent</div>
        </div>
      </div>

      {/* Booked Sessions */}
      <div className="dashboard-section">
        <h2>📅 Your Upcoming Sessions ({bookedSessions.length})</h2>
        {bookedSessions.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any upcoming sessions.</p>
            <p className="empty-hint">Book a session with a mentor to get started!</p>
            <div className="empty-actions">
              <button 
                onClick={() => navigate('/ai-match')}
                className="btn-ai"
              >
                🤖 Find Mentor with AI
              </button>
              <button 
                onClick={() => navigate('/mentors')}
                className="btn-primary"
              >
                Browse All Mentors
              </button>
            </div>
          </div>
        ) : (
          <div className="sessions-list">
            {bookedSessions.map(session => (
              <div key={session.id} className="session-card upcoming">
                <div className="session-header">
                  <span className="session-time">{formatDateTime(session.slot_start_time)}</span>
                  <span className={`session-status status-${session.status}`}>
                    {session.status}
                  </span>
                </div>
                <div className="session-details">
                  <div className="session-mentor">
                    <strong>Mentor:</strong> {session.mentor_name || 'Unknown'}
                  </div>
                  <div className="session-duration">
                    <strong>Duration:</strong> {session.duration_minutes || 60} minutes
                  </div>
                  <div className="session-cost">
                    <strong>Cost:</strong> {formatCurrency(session.total_amount)}
                  </div>
                  {session.payment_status && (
                    <div className="session-payment">
                      <strong>Payment:</strong> 
                      <span className={`payment-status status-${session.payment_status}`}>
                        {session.payment_status}
                      </span>
                    </div>
                  )}
                  {session.notes && (
                    <div className="session-notes">
                      <strong>Your notes:</strong> {session.notes}
                    </div>
                  )}
                </div>
                <div className="session-actions">
                  <button 
                    onClick={() => navigate(`/booking/${session.id}`)}
                    className="btn-secondary btn-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      <div className="dashboard-section">
        <h2>📜 Past Sessions ({pastSessions.length})</h2>
        {pastSessions.length === 0 ? (
          <div className="empty-state">
            <p>No past sessions yet.</p>
          </div>
        ) : (
          <div className="sessions-list">
            {pastSessions.slice(0, 5).map(session => (
              <div key={session.id} className="session-card past">
                <div className="session-header">
                  <span className="session-time">{formatDateTime(session.slot_start_time)}</span>
                  <span className={`session-status status-${session.status}`}>
                    {session.status}
                  </span>
                </div>
                <div className="session-details">
                  <div className="session-mentor">
                    <strong>Mentor:</strong> {session.mentor_name || 'Unknown'}
                  </div>
                  <div className="session-cost">
                    <strong>Paid:</strong> {formatCurrency(session.total_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {pastSessions.length > 5 && (
          <button 
            onClick={() => navigate('/booking-history')}
            className="btn-link"
          >
            View all {pastSessions.length} past sessions →
          </button>
        )}
      </div>

      {/* Payment History */}
      <div className="dashboard-section">
        <h2>💳 Payment History ({paymentHistory.length})</h2>
        {paymentHistory.length === 0 ? (
          <div className="empty-state">
            <p>No payment history yet.</p>
          </div>
        ) : (
          <div className="payment-list">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Session</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.slice(0, 10).map(payment => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      {payment.booking?.mentor_name || 'Unknown Mentor'}
                      <br />
                      <small>{formatDateTime(payment.booking?.slot_start_time)}</small>
                    </td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className={`payment-status status-${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {paymentHistory.length > 10 && (
          <button 
            onClick={() => navigate('/payment-history')}
            className="btn-link"
          >
            View all {paymentHistory.length} payments →
          </button>
        )}
      </div>
    </div>
  );
}
