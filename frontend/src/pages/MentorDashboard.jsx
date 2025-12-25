import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './Dashboard.css';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0, pending: 0 });
  const [availability, setAvailability] = useState([]);

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
        const upcoming = bookings.filter(b => new Date(b.slot_start_time) > now && b.status !== 'cancelled');
        const past = bookings.filter(b => new Date(b.slot_start_time) <= now || b.status === 'cancelled');
        
        setUpcomingSessions(upcoming);
        setPastSessions(past);
        
        // Calculate earnings from completed sessions
        const completedSessions = past.filter(b => b.status === 'confirmed');
        const totalEarnings = completedSessions.reduce((sum, b) => sum + (b.mentor_payout || 0), 0);
        
        // This month's earnings
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEarnings = completedSessions
          .filter(b => new Date(b.slot_start_time) >= thisMonth)
          .reduce((sum, b) => sum + (b.mentor_payout || 0), 0);
        
        // Pending earnings (upcoming sessions)
        const pendingEarnings = upcoming.reduce((sum, b) => sum + (b.mentor_payout || 0), 0);
        
        setEarnings({
          total: totalEarnings,
          thisMonth: monthEarnings,
          pending: pendingEarnings
        });
      }
      
      // Fetch availability
      const availRes = await fetch(`${API_BASE}/bookings/my-availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (availRes.ok) {
        const avail = await availRes.json();
        setAvailability(avail);
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
    <div className="dashboard mentor-dashboard">
      <div className="dashboard-header">
        <h1>Mentor Dashboard</h1>
        <button 
          onClick={() => navigate('/availability-manager')} 
          className="btn-primary"
        >
          ⚙️ Manage Availability
        </button>
      </div>

      {/* Earnings Summary */}
      <div className="earnings-summary">
        <h2>💰 Earnings Summary</h2>
        <div className="earnings-cards">
          <div className="earning-card">
            <div className="earning-label">Total Earnings</div>
            <div className="earning-amount">{formatCurrency(earnings.total)}</div>
          </div>
          <div className="earning-card">
            <div className="earning-label">This Month</div>
            <div className="earning-amount">{formatCurrency(earnings.thisMonth)}</div>
          </div>
          <div className="earning-card">
            <div className="earning-label">Pending</div>
            <div className="earning-amount">{formatCurrency(earnings.pending)}</div>
            <div className="earning-note">{upcomingSessions.length} upcoming sessions</div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="dashboard-section">
        <h2>📅 Upcoming Sessions ({upcomingSessions.length})</h2>
        {upcomingSessions.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming sessions scheduled.</p>
            <p className="empty-hint">Sessions will appear here when mentees book with you.</p>
          </div>
        ) : (
          <div className="sessions-list">
            {upcomingSessions.map(session => (
              <div key={session.id} className="session-card upcoming">
                <div className="session-header">
                  <span className="session-time">{formatDateTime(session.slot_start_time)}</span>
                  <span className={`session-status status-${session.status}`}>
                    {session.status}
                  </span>
                </div>
                <div className="session-details">
                  <div className="session-mentee">
                    <strong>Mentee:</strong> {session.mentee_name || 'Unknown'}
                  </div>
                  <div className="session-duration">
                    <strong>Duration:</strong> {session.duration_minutes || 60} minutes
                  </div>
                  <div className="session-earning">
                    <strong>Your payout:</strong> {formatCurrency(session.mentor_payout)}
                  </div>
                  {session.notes && (
                    <div className="session-notes">
                      <strong>Notes:</strong> {session.notes}
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
                  <div className="session-mentee">
                    <strong>Mentee:</strong> {session.mentee_name || 'Unknown'}
                  </div>
                  <div className="session-earning">
                    <strong>Earned:</strong> {formatCurrency(session.mentor_payout)}
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

      {/* Availability Summary */}
      <div className="dashboard-section">
        <h2>🕐 Current Availability</h2>
        {availability.length === 0 ? (
          <div className="empty-state">
            <p>You haven't set your availability yet.</p>
            <button 
              onClick={() => navigate('/availability-manager')}
              className="btn-primary"
            >
              Set Your Availability
            </button>
          </div>
        ) : (
          <div className="availability-summary">
            <p>You have {availability.length} availability slots set.</p>
            <button 
              onClick={() => navigate('/availability-manager')}
              className="btn-secondary"
            >
              Manage Availability
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
