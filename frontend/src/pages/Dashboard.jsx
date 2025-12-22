import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
      const res = await fetch('http://127.0.0.1:8000/profiles/me', {
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
          <button onClick={() => navigate('/mentors')} className="btn-action">
            Browse Mentors
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
