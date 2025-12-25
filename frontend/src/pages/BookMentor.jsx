import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import BookingCalendar from '../components/BookingCalendar';
import './BookMentor.css';

export default function BookMentor() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMentorDetails();
  }, [mentorId]);

  const fetchMentorDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/profiles/mentor/${mentorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMentor(data);
      } else {
        setError('Mentor not found');
      }
    } catch (err) {
      setError('Error loading mentor details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingCreated = () => {
    navigate('/bookings');
  };

  if (loading) {
    return (
      <div className="book-mentor-page">
        <div className="loading">Loading mentor details...</div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="book-mentor-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'Mentor not found'}</p>
          <button onClick={() => navigate('/mentors')} className="btn-back">
            Back to Mentors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-mentor-page">
      <div className="mentor-info-banner">
        <button onClick={() => navigate('/mentors')} className="btn-back-small">
          ← Back to Mentors
        </button>
        <div className="mentor-summary">
          <h1>{mentor.full_name}</h1>
          <div className="mentor-meta">
            <span className="domain">🎯 {mentor.domains}</span>
            <span className="experience">💼 {mentor.years_experience} years</span>
            <span className="rate">💰 £{mentor.hourly_rate}/hour</span>
          </div>
          <p className="bio">{mentor.bio}</p>
        </div>
      </div>

      <BookingCalendar
        mentorId={parseInt(mentorId)}
        mentorName={mentor.full_name}
        hourlyRate={mentor.hourly_rate}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
}