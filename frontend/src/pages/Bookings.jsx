import BookingList from '../components/BookingList';
import AvailabilityManager from '../components/AvailabilityManager';
import { useState } from 'react';
import './Bookings.css';

export default function Bookings() {
  const userRole = localStorage.getItem('role');
  const [activeTab, setActiveTab] = useState('bookings');

  return (
    <div className="bookings-page">
      {userRole === 'mentor' && (
        <div className="bookings-tabs">
          <button
            className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 My Bookings
          </button>
          <button
            className={`tab-button ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            🕐 Manage Availability
          </button>
        </div>
      )}

      {activeTab === 'bookings' && <BookingList />}
      {activeTab === 'availability' && userRole === 'mentor' && <AvailabilityManager />}
    </div>
  );
}
