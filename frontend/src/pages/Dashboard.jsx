import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import './Dashboard.css';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/profiles/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Welcome to Mentor Platform</h1>
      
      {/* AI BANNER - Only for mentees */}
      {user?.role === 'mentee' && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>🤖</div>
          <h2 style={{ margin: '1rem 0 0.5rem 0' }}>Find Your Perfect Mentor with AI</h2>
          <p style={{ margin: '0 0 1.5rem 0', opacity: 0.95 }}>
            Answer a few questions and let our AI match you with the best mentors
          </p>
          <button 
            onClick={() => navigate('/ai-match')}
            style={{
              background: 'white',
              color: '#667eea',
              padding: '1rem 2.5rem',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            🚀 Start AI Matching
          </button>
        </div>
      )}
      
      {!profile ? (
        <div className="no-profile">
          <h2>Complete Your Profile</h2>
          <p>You haven't created your profile yet. Get started to connect with {user?.role === 'mentor' ? 'mentees' : 'mentors'}!</p>
          <button 
            onClick={() => navigate(user?.role === 'mentor' ? '/profile/mentor' : '/profile/mentee')}
            className="btn-primary"
          >
            Create Profile
          </button>
        </div>
      ) : (
        <div className="profile-summary">
          <h2>Your Profile</h2>
          {user?.role === 'mentor' ? (
            <div className="profile-card">
              <h3>{profile.profile?.full_name}</h3>
              <p><strong>Domains:</strong> {profile.profile?.domains}</p>
              <p><strong>Skills:</strong> {profile.profile?.skills}</p>
              <p><strong>Experience:</strong> {profile.profile?.years_experience} years</p>
              <p><strong>Rate:</strong> ${profile.profile?.hourly_rate}/hr</p>
              <button onClick={() => navigate('/profile/mentor')} className="btn-secondary">
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="profile-card">
              <h3>{profile.profile?.name}</h3>
              <p><strong>Goals:</strong> {profile.profile?.goals}</p>
              <p><strong>Background:</strong> {profile.profile?.background}</p>
              <button onClick={() => navigate('/profile/mentee')} className="btn-secondary">
                Edit Profile
              </button>
            </div>
          )}
        </div>
      )}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {user?.role === 'mentee' && (
            <button 
              onClick={() => navigate('/ai-match')} 
              className="btn-action"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              🤖 AI Mentor Match
            </button>
          )}
          <button onClick={() => navigate('/mentors')} className="btn-action">
            Browse All Mentors
          </button>
          {user?.role === 'mentor' && (
            <button onClick={() => navigate('/profile/mentor')} className="btn-action">
              Manage Profile
            </button>
          )}
          {user?.role === 'mentee' && (
            <button onClick={() => navigate('/profile/mentee')} className="btn-action">
              Manage Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
