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
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
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

  const handleSetMeetingLink = async (bookingId) => {
    const meetingLink = prompt('Paste Zoom/Google Meet link (https://...)');
    if (!meetingLink) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/meeting-link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meeting_link: meetingLink })
      });

      if (response.ok) {
        alert('Meeting link saved');
        fetchBookings();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (err) {
      alert('Error saving meeting link');
      console.error(err);
    }
  };

  const handleSubmitSummary = async (bookingId) => {
    const sessionSummary = prompt('Enter session summary (visible to mentee):');
    if (!sessionSummary) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/submit-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_summary: sessionSummary })
      });

      if (response.ok) {
        alert('Summary submitted. Waiting for mentee approval.');
        fetchBookings();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (err) {
      alert('Error submitting summary');
      console.error(err);
    }
  };

  const handleMenteeConsent = async (bookingId, consent) => {
    const note = consent ? null : prompt('Optional note to mentor (why you declined):');
    if (!consent && note === null) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/mentee-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ consent, note: note || null })
      });

      if (response.ok) {
        alert(consent ? 'Approved. Payment will be released to mentor.' : 'Declined. Mentor will be notified.');
        fetchBookings();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (err) {
      alert('Error submitting consent');
      console.error(err);
    }
  };

  const handlePayNow = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const successUrl = `${window.location.origin}/bookings?payment=success`;
      const cancelUrl = `${window.location.origin}/bookings?payment=cancel`;
      const url = `${API_BASE}/payments/create-checkout-session?booking_id=${encodeURIComponent(bookingId)}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
        alert('Payment session created, but checkout URL is missing');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to start payment'}`);
      }
    } catch (err) {
      alert('Error starting payment');
      console.error(err);
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
            const hasMeetingLink = !!(booking.meeting_link || '').trim();
            const hasSummary = !!(booking.session_summary || '').trim();
            const consent = booking.mentee_consent;
            const consentPending = consent === null || consent === undefined;
            const consentLabel = consent === true ? '✅ Approved' : consent === false ? '❌ Declined' : '⏳ Pending';

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

                {(hasMeetingLink || (isMentor && (booking.status === 'confirmed' || booking.status === 'completed'))) && (
                  <div className="booking-message">
                    <strong>Meeting link:</strong>
                    {hasMeetingLink ? (
                      <p>
                        <a href={booking.meeting_link} target="_blank" rel="noreferrer">{booking.meeting_link}</a>
                      </p>
                    ) : (
                      <p>Not set yet</p>
                    )}
                  </div>
                )}

                {hasSummary && (
                  <div className="booking-message">
                    <strong>Session summary:</strong>
                    <p>{booking.session_summary}</p>
                    <p><strong>Mentee confirmation:</strong> {consentLabel}</p>
                    {booking.mentee_consent_note && (
                      <p><strong>Note:</strong> {booking.mentee_consent_note}</p>
                    )}
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
                        className="btn-info"
                        onClick={() => handleSetMeetingLink(booking.id)}
                      >
                        🔗 Set Meeting Link
                      </button>
                      <button
                        className="btn-complete"
                        onClick={() => handleComplete(booking.id)}
                      >
                        ✅ Mark Completed
                      </button>
                      <button
                        className="btn-info"
                        onClick={() => handleSubmitSummary(booking.id)}
                      >
                        📝 Submit Summary
                      </button>
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {isMentor && booking.status === 'completed' && (
                    <>
                      <button
                        className="btn-info"
                        onClick={() => handleSetMeetingLink(booking.id)}
                      >
                        🔗 Set Meeting Link
                      </button>
                      <button
                        className="btn-info"
                        onClick={() => handleSubmitSummary(booking.id)}
                      >
                        📝 Update Summary
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
                    <>
                      {(booking.payment_status || '').toLowerCase() !== 'paid' && (
                        <button
                          className="btn-confirm"
                          onClick={() => handlePayNow(booking.id)}
                        >
                          💳 Pay Now
                        </button>
                      )}
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel Booking
                      </button>
                    </>
                  )}

                  {booking.status === 'completed' && !isMentor && hasSummary && consentPending && (
                    <>
                      <button
                        className="btn-confirm"
                        onClick={() => handleMenteeConsent(booking.id, true)}
                      >
                        ✅ Approve Summary
                      </button>
                      <button
                        className="btn-cancel-booking"
                        onClick={() => handleMenteeConsent(booking.id, false)}
                      >
                        ❌ Decline
                      </button>
                    </>
                  )}

                  {booking.status === 'completed' && !isMentor && (!hasSummary || !consentPending) && (
                    <button className="btn-info" disabled>
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