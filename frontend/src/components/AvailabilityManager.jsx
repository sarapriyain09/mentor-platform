import { useState, useEffect } from 'react';
import './AvailabilityManager.css';

export default function AvailabilityManager() {
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New slot form
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00'
  });

  // Block date form
  const [blockDateForm, setBlockDateForm] = useState({
    blocked_date: '',
    reason: ''
  });

  const daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  useEffect(() => {
    fetchAvailability();
    fetchBlockedDates();
  }, []);

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/bookings/availability/my-slots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailabilitySlots(data);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/bookings/blocked-dates/my-dates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBlockedDates(data);
      }
    } catch (err) {
      console.error('Error fetching blocked dates:', err);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/bookings/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSlot)
      });

      if (response.ok) {
        await fetchAvailability();
        setShowAddSlot(false);
        setNewSlot({ day_of_week: 1, start_time: '09:00', end_time: '10:00' });
        alert('Availability slot added successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add slot');
      }
    } catch (err) {
      setError('Error adding availability slot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = async (slotId, isActive) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/bookings/availability/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        await fetchAvailability();
      }
    } catch (err) {
      console.error('Error toggling slot:', err);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/bookings/availability/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchAvailability();
        alert('Slot deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting slot:', err);
    }
  };

  const handleBlockDate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/bookings/blocked-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(blockDateForm)
      });

      if (response.ok) {
        await fetchBlockedDates();
        setShowBlockDate(false);
        setBlockDateForm({ blocked_date: '', reason: '' });
        alert('Date blocked successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to block date');
      }
    } catch (err) {
      setError('Error blocking date');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async (blockedId) => {
    if (!confirm('Are you sure you want to unblock this date?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/bookings/blocked-dates/${blockedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchBlockedDates();
        alert('Date unblocked successfully');
      }
    } catch (err) {
      console.error('Error unblocking date:', err);
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getDayLabel = (dayNum) => {
    return daysOfWeek.find(d => d.value === dayNum)?.label || 'Unknown';
  };

  // Group slots by day
  const slotsByDay = availabilitySlots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {});

  return (
    <div className="availability-manager">
      <div className="manager-header">
        <h2>📅 Manage Your Availability</h2>
        <div className="header-actions">
          <button 
            className="btn-add"
            onClick={() => setShowAddSlot(true)}
          >
            + Add Time Slot
          </button>
          <button 
            className="btn-block"
            onClick={() => setShowBlockDate(true)}
          >
            🚫 Block Date
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Weekly Availability */}
      <div className="weekly-availability">
        <h3>Weekly Schedule</h3>
        {daysOfWeek.map(day => (
          <div key={day.value} className="day-section">
            <div className="day-header">
              <h4>{day.label}</h4>
              {slotsByDay[day.value]?.length > 0 && (
                <span className="slot-count">{slotsByDay[day.value].length} slots</span>
              )}
            </div>
            
            <div className="day-slots">
              {slotsByDay[day.value]?.length > 0 ? (
                slotsByDay[day.value].map(slot => (
                  <div key={slot.id} className={`slot-card ${!slot.is_active ? 'inactive' : ''}`}>
                    <div className="slot-time">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                    <div className="slot-actions">
                      <button
                        className={`btn-toggle ${slot.is_active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleSlot(slot.id, slot.is_active)}
                      >
                        {slot.is_active ? '✓ Active' : '✗ Inactive'}
                      </button>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-slots">No availability set for this day</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Blocked Dates */}
      <div className="blocked-dates-section">
        <h3>🚫 Blocked Dates</h3>
        {blockedDates.length > 0 ? (
          <div className="blocked-dates-list">
            {blockedDates.map(blocked => (
              <div key={blocked.id} className="blocked-date-card">
                <div className="blocked-info">
                  <div className="blocked-date">
                    {new Date(blocked.blocked_date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {blocked.reason && (
                    <div className="blocked-reason">{blocked.reason}</div>
                  )}
                </div>
                <button
                  className="btn-unblock"
                  onClick={() => handleUnblockDate(blocked.id)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-blocked">No blocked dates</p>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddSlot && (
        <div className="modal-overlay" onClick={() => setShowAddSlot(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Availability Slot</h3>
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label>Day of Week</label>
                <select
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({...newSlot, day_of_week: Number(e.target.value)})}
                  required
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddSlot(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Date Modal */}
      {showBlockDate && (
        <div className="modal-overlay" onClick={() => setShowBlockDate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Block a Date</h3>
            <form onSubmit={handleBlockDate}>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={blockDateForm.blocked_date}
                  onChange={(e) => setBlockDateForm({...blockDateForm, blocked_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason (optional)</label>
                <input
                  type="text"
                  value={blockDateForm.reason}
                  onChange={(e) => setBlockDateForm({...blockDateForm, reason: e.target.value})}
                  placeholder="e.g., Holiday, Personal leave"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBlockDate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Blocking...' : 'Block Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}