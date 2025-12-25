import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './MentorList.css';

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function MentorList() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();  // NEW

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const res = await fetch(`${API_BASE}/profiles/mentors`);
      if (res.ok) {
        const data = await res.json();
        setMentors(data);
      }
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestMentorship = async (mentorId, mentorName) => {
    const token = localStorage.getItem('token');
    const requestMessage = prompt(`Send a message to ${mentorName}:`, 'Hi! I would love to connect with you as a mentor.');
    
    if (!requestMessage) return;

    try {
      const res = await fetch(`${API_BASE}/mentorship/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mentor_id: mentorId,
          message: requestMessage
        })
      });

      if (res.ok) {
        setMessage(`Request sent to ${mentorName}!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await res.json();
        alert(error.detail || 'Failed to send request');
      }
    } catch (err) {
      alert('Failed to send request');
    }
  };

  // NEW: Navigate to booking page
  const bookSession = (mentorId) => {
    navigate(`/book-mentor/${mentorId}`);
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
    mentor.skills?.toLowerCase().includes(filter.toLowerCase()) ||
    mentor.domains?.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="loading">Loading mentors...</div>;

  return (
    <div className="mentor-list-page">
      <h1>Find a Mentor</h1>
      
      {message && <div className="success">{message}</div>}
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name, skills, or domain..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="mentor-grid">
        {filteredMentors.length === 0 ? (
          <p className="no-results">No mentors found. Try a different search term.</p>
        ) : (
          filteredMentors.map((mentor) => (
            <div key={mentor.id} className="mentor-card">
              <div className="mentor-header">
                <h3>{mentor.full_name}</h3>
                {mentor.is_verified && <span className="verified-badge">✓ Verified</span>}
              </div>
              
              <div className="mentor-info">
                <p><strong>Domains:</strong> {mentor.domains}</p>
                <div className="mentor-skills">
                  <strong>Skills:</strong>
                  <div className="skill-tags">
                    {splitList(mentor.skills).map((skill) => (
                      <span key={skill} className="skill-tag" title={skill}>{skill}</span>
                    ))}
                  </div>
                </div>
                <p><strong>Experience:</strong> {mentor.years_experience} years</p>
                <p><strong>Availability:</strong> {mentor.availability}</p>
                <p><strong>Rate:</strong> £{mentor.hourly_rate}/hour</p>
              </div>
              
              <div className="mentor-bio">
                <p>{mentor.bio}</p>
              </div>
              
              {/* NEW: Action buttons */}
              <div className="mentor-actions">
                <button 
                  className="btn-book-session"
                  onClick={() => bookSession(mentor.user_id)}
                >
                  📅 Book Session
                </button>
                <button 
                  className="btn-connect"
                  onClick={() => requestMentorship(mentor.user_id, mentor.full_name)}
                >
                  Request Mentorship
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
