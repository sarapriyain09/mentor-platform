import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Requests.css';

export default function Requests() {
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const role = localStorage.getItem('role');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      if (role === 'mentee') {
        const sentRes = await fetch('http://127.0.0.1:8000/mentorship/requests/sent', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sentRes.ok) {
          const data = await sentRes.json();
          setSentRequests(data);
        }
      } else if (role === 'mentor') {
        const receivedRes = await fetch('http://127.0.0.1:8000/mentorship/requests/received', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (receivedRes.ok) {
          const data = await receivedRes.json();
          setReceivedRequests(data);
        }
      }

      // Fetch active mentorships for both
      const mentorshipsRes = await fetch('http://127.0.0.1:8000/mentorship/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mentorshipsRes.ok) {
        const data = await mentorshipsRes.json();
        setMentorships(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/mentorship/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage('Request accepted! Mentorship created.');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      }
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const rejectRequest = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/mentorship/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage('Request rejected.');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      }
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  const completeMentorship = async (mentorshipId) => {
    if (!confirm('Mark this mentorship as completed?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/mentorship/mentorships/${mentorshipId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage('Mentorship marked as completed.');
        setTimeout(() => setMessage(''), 3000);
        fetchData();
      }
    } catch (err) {
      alert('Failed to complete mentorship');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="requests-page">
      <h1>My Mentorships</h1>
      
      {message && <div className="success">{message}</div>}

      {/* Active Mentorships */}
      <section className="requests-section">
        <h2>Active Mentorships</h2>
        {mentorships.length === 0 ? (
          <p className="no-data">No active mentorships yet.</p>
        ) : (
          <div className="requests-grid">
            {mentorships.map((m) => (
              <div key={m.id} className="request-card mentorship-card">
                <h3>{role === 'mentor' ? m.mentee_name : m.mentor_name}</h3>
                <p><strong>Started:</strong> {new Date(m.start_date).toLocaleDateString()}</p>
                {m.notes && <p><strong>Notes:</strong> {m.notes}</p>}
                <button 
                  onClick={() => completeMentorship(m.id)}
                  className="btn-secondary"
                >
                  Mark as Completed
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mentee: Sent Requests */}
      {role === 'mentee' && (
        <section className="requests-section">
          <h2>My Requests</h2>
          {sentRequests.length === 0 ? (
            <p className="no-data">You haven't sent any requests yet. <a onClick={() => navigate('/mentors')}>Find a mentor</a></p>
          ) : (
            <div className="requests-grid">
              {sentRequests.map((req) => (
                <div key={req.id} className="request-card">
                  <h3>{req.mentor_name}</h3>
                  <p><strong>Status:</strong> <span className={`status-${req.status}`}>{req.status}</span></p>
                  <p><strong>Message:</strong> {req.message}</p>
                  <p className="request-date">Sent: {new Date(req.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Mentor: Received Requests */}
      {role === 'mentor' && (
        <section className="requests-section">
          <h2>Received Requests</h2>
          {receivedRequests.length === 0 ? (
            <p className="no-data">No requests received yet.</p>
          ) : (
            <div className="requests-grid">
              {receivedRequests.map((req) => (
                <div key={req.id} className="request-card">
                  <h3>{req.mentee_name}</h3>
                  <p><strong>Status:</strong> <span className={`status-${req.status}`}>{req.status}</span></p>
                  <p><strong>Message:</strong> {req.message}</p>
                  <p className="request-date">Received: {new Date(req.created_at).toLocaleString()}</p>
                  {req.status === 'pending' && (
                    <div className="request-actions">
                      <button onClick={() => acceptRequest(req.id)} className="btn-accept">
                        Accept
                      </button>
                      <button onClick={() => rejectRequest(req.id)} className="btn-reject">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
