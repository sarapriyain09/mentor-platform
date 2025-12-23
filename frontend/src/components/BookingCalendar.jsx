import { useState, useEffect } from 'react';
import './BookingCalendar.css';

export default function BookingCalendar({ mentorId, mentorName, hourlyRate, onBookingCreated }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(60); // default 60 minutes
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate date range (next 14 days)
  const getDateRange = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dateRange = getDateRange();

  // Fetch available slots when mentor or date changes
  useEffect(() => {
    if (mentorId) {
      fetchAvailableSlots();
    }
  }, [mentorId]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError('');
    
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/bookings/availability/mentor/${mentorId}?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.available_slots);
      } else {
        setError('Failed to load available slots');
      }
    } catch (err) {
      setError('Error loading availability');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSlotsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.filter(slot => slot.date === dateStr);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const calculateAmount = () => {
    return (hourlyRate * (duration / 60)).toFixed(2);
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setLoading(true);
    setError('');

    const bookingData = {
      mentor_id: mentorId,
      session_date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      duration_minutes: duration,
      mentee_message: message
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const booking = await response.json();
        alert('Booking request sent successfully! Waiting for mentor confirmation.');
        if (onBookingCreated) {
          onBookingCreated(booking);
        }
        // Reset form
        setSelectedDate(null);
        setSelectedSlot(null);
        setMessage('');
        fetchAvailableSlots(); // Refresh slots
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create booking');
      }
    } catch (err) {
      setError('Error creating booking');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    // timeStr is in HH:MM:SS format
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="booking-calendar">
      <div className="booking-header">
        <h2>Book a Session with {mentorName}</h2>
        <p className="hourly-rate">£{hourlyRate}/hour</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="booking-container">
        {/* Date Selection */}
        <div className="date-selection">
          <h3>Select Date</h3>
          <div className="date-grid">
            {dateRange.map((date, index) => {
              const slots = getSlotsForDate(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const hasSlots = slots.length > 0;
              
              return (
                <button
                  key={index}
                  className={`date-card ${isSelected ? 'selected' : ''} ${!hasSlots ? 'no-slots' : ''}`}
                  onClick={() => hasSlots && handleDateSelect(date)}
                  disabled={!hasSlots}
                >
                  <div className="date-day">{date.getDate()}</div>
                  <div className="date-month">
                    {date.toLocaleDateString('en-GB', { month: 'short' })}
                  </div>
                  {hasSlots && <div className="slots-count">{slots.length} slots</div>}
                  {!hasSlots && <div className="no-slots-text">Unavailable</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div className="time-selection">
            <h3>Available Times on {formatDate(selectedDate)}</h3>
            <div className="time-slots">
              {getSlotsForDate(selectedDate).map((slot, index) => (
                <button
                  key={index}
                  className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                  onClick={() => handleSlotSelect(slot)}
                >
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  <span className="duration">({slot.duration_minutes} min)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Booking Details */}
        {selectedSlot && (
          <div className="booking-details">
            <h3>Session Details</h3>
            
            <div className="form-group">
              <label>Session Duration</label>
              <select 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                className="duration-select"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message to Mentor (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What would you like to discuss in this session?"
                rows={4}
                className="message-input"
              />
            </div>

            <div className="booking-summary">
              <div className="summary-row">
                <span>Date:</span>
                <strong>{formatDate(selectedDate)}</strong>
              </div>
              <div className="summary-row">
                <span>Time:</span>
                <strong>{formatTime(selectedSlot.start_time)}</strong>
              </div>
              <div className="summary-row">
                <span>Duration:</span>
                <strong>{duration} minutes</strong>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <strong>£{calculateAmount()}</strong>
              </div>
            </div>

            <button 
              className="btn-book"
              onClick={handleBooking}
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Request Booking'}
            </button>

            <p className="booking-note">
              ⚠️ Payment will be processed after mentor confirms the booking
            </p>
          </div>
        )}
      </div>

      {loading && !error && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading availability...</p>
        </div>
      )}
    </div>
  );
}