import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './BookingList.css';

export default function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all'); // all, requested, confirmed, completed, cancelled
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const filterParam = filter !== 'all' ? `?status_filter=${filter}` : '';
      const response = await fetch(`${API_BASE}/bookings/my-bookings${filterParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        setError('Failed to load bookings');
      }
    } catch (err) {
      setError('Error loading bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus, cancellationReason = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          cancellation_reason: cancellationReason
        })
      });

      if (response.ok) {
        alert(`Booking ${newStatus} successfully!`);
        fetchBookings(); // Refresh list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (err) {
      alert('Error updating booking status');
      console.error(err);
    }
  };

  const handleConfirm = (bookingId) => {
    if (confirm('Confirm this booking?')) {
      handleStatusUpdate(bookingId, 'confirmed');
    }
  };

  const handleCancel = (bookingId) => {
    const reason = prompt('Reason for cancellation (optional):');
    if (reason !== null) { // null means user clicked cancel on prompt
      handleStatusUpdate(bookingId, 'cancelled', reason || 'No reason provided');
    }
  };

  const handleComplete = (bookingId) => {
    if (confirm('Mark this session as completed?')) {
      handleStatusUpdate(bookingId, 'completed');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      requested: { class: 'status-requested', text: '⏳ Requested' },
      confirmed: { class: 'status-confirmed', text: '✓ Confirmed' },
      completed: { class: 'status-completed', text: '✅ Completed' },
      cancelled: { class: 'status-cancelled', text: '❌ Cancelled' }
    };
    return badges[status] || { class: '', text: status };
  };

  const getPaymentBadge = (paymentStatus) => {
    const badges = {
      pending: { class: 'payment-pending', text: '⏳ Pending' },
      paid: { class: 'payment-paid', text: '✓ Paid' },
      refunded: { class: 'payment-refunded', text: '↩ Refunded' }
    };
    return badges[paymentStatus] || { class: '', text: paymentStatus };
  };

  if (loading) {
    return (
      <div className="booking-list-container">
        <div className="loading-spinner">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="booking-list-container">
      <div className="booking-list-header">
        <h2>📅 My Bookings</h2>
        
        {userRole === 'mentee' && (
          <button 
            className="btn-new-booking"
            onClick={() => navigate('/mentors')}
          >
            + Book New Session
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({bookings.length})
        </button>
        <button
          className={`filter-tab ${filter === 'requested' ? 'active' : ''}`}
          onClick={() => setFilter('requested')}
        >
          Requested
        </button>
        <button
          className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setFilter('confirmed')}
        >
          Confirmed
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>No bookings found</p>
          {userRole === 'mentee' && (
            <button 
              className="btn-browse-mentors"
              onClick={() => navigate('/mentors')}
            >
              Browse Mentors
            </button>
          )}
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map(booking => {
            const statusBadge = getStatusBadge(booking.status);
            const paymentBadge = getPaymentBadge(booking.payment_status);
            const isMentor = userRole === 'mentor';
            const otherPerson = isMentor ? booking.mentee_name : booking.mentor_name;
            const otherEmail = isMentor ? booking.mentee_email : booking.mentor_email;

            return (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-header">
                  <div className="booking-person">
                    <h3>{otherPerson}</h3>
                    <p className="person-email">{otherEmail}</p>
                  </div>
                  <div className="booking-badges">
                    <span className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                    <span className={`payment-badge ${paymentBadge.class}`}>
                      {paymentBadge.text}
                    </span>
                  </div>
                </div>

                <div className="booking-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">📅 Date</span>
                    <span className="detail-value">{formatDate(booking.session_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🕐 Time</span>
                    <span className="detail-value">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">⏱ Duration</span>
                    <span className="detail-value">{booking.duration_minutes} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">💰 Amount</span>
                    <span className="detail-value">£{booking.amount.toFixed(2)}</span>
                  </div>
                </div>

                {booking.mentee_message && (
                  <div className="booking-message">
                    <strong>Message:</strong>
                    <p>{booking.mentee_message}</p>
                  </div>
                )}

                {booking.cancellation_reason && (
                  <div className="cancellation-reason">
                    <strong>Cancellation reason:</strong>
                    <p>{booking.cancellation_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="booking-actions">
                  {/* Mentor Actions */}
                  {isMentor && booking.status === 'requested' && (
                    <>
                      <button
                        className="btn-confirm"
                        onClick={() => handleConfirm(booking.id)}
                      >
                        ✓ Confirm
                      </button>
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleCancel(booking.id)}
                      >
                        ✗ Decline
                      </button>
                    </>
                  )}
                  
                  {isMentor && booking.status === 'confirmed' && (
                    <>
                      <button
                        className="btn-complete"
                        onClick={() => handleComplete(booking.id)}
                      >
                        ✅ Mark Completed
                      </button>
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Mentee Actions */}
                  {!isMentor && booking.status === 'requested' && (
                    <button
                      className="btn-cancel-booking"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel Request
                    </button>
                  )}

                  {!isMentor && booking.status === 'confirmed' && (
                    <button
                      className="btn-cancel-booking"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {booking.status === 'completed' && (
                    <button
                      className="btn-info"
                      disabled
                    >
                      Session Completed
                    </button>
                  )}

                  {booking.status === 'cancelled' && (
                    <button
                      className="btn-info"
                      disabled
                    >
                      Cancelled
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}