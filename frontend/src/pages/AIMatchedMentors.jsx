// frontend/src/pages/AIMatchedMentors.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MentorList.css';

export default function AIMatchedMentors({ matches }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const requestMentorship = async (mentorId, mentorName) => {
    const token = localStorage.getItem('token');
    const requestMessage = prompt(
      `Send a message to ${mentorName}:`, 
      'Hi! Based on my goals and the AI recommendation, I think we would be a great match. I would love to connect with you as a mentor!'
    );
    
    if (!requestMessage) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/mentorship/requests', {
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
        window.__toast?.add?.(error.detail || 'Failed to send request', 'error');
      }
    } catch (err) {
      window.__toast?.add?.('Failed to send request', 'error');
    }
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="mentor-list-page">
        <div className="match-header">
          <h1>🔍 No Matches Yet</h1>
          <p className="match-subtitle">
            We couldn't find perfect matches, but don't worry!
          </p>
        </div>
        <div className="actions">
          <button onClick={() => navigate('/mentors')} className="btn-primary">
            Browse All Mentors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-list-page">
      <div className="match-header">
        <h1>🎯 Your Perfect Matches</h1>
        <p className="match-subtitle">
          Based on our conversation, here are the top mentors matched to your goals
        </p>
      </div>

      {message && <div className="success">{message}</div>}

      <div className="mentor-grid">
        {matches.map((match) => (
          <div key={match.mentor_id} className="mentor-card ai-matched">
            <div className="match-score-badge">{match.match_score}% Match</div>
            
            <div className="mentor-header">
              <h3>{match.mentor_name}</h3>
              {match.is_verified && <span className="verified-badge">✓ Verified</span>}
            </div>
            
            <div className="match-reasons">
              <h4>Why this match:</h4>
              <ul>
                {match.match_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
            
            <div className="mentor-info">
              <p><strong>Domains:</strong> {match.mentor_domains}</p>
              <p><strong>Skills:</strong> {match.mentor_skills}</p>
              <p><strong>Experience:</strong> {match.mentor_experience} years</p>
              <p><strong>Availability:</strong> {match.mentor_availability}</p>
              <p><strong>Rate:</strong> ${match.mentor_rate}/hour</p>
            </div>
            
            <div className="mentor-bio">
              <p>{match.mentor_bio}</p>
            </div>
            
            <button 
              className="btn-connect"
              onClick={() => requestMentorship(match.mentor_id, match.mentor_name)}
            >
              Connect with {match.mentor_name.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>

      <div className="actions">
        <button onClick={() => navigate('/mentors')} className="btn-secondary">
          Browse All Mentors
        </button>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}