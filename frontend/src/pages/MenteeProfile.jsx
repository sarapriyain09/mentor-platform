import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './Profile.css';

export default function MenteeProfile() {
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'create' | 'empty'
  const [form, setForm] = useState({
    name: '',
    goals: '',
    background: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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
        if (data.profile) {
          setProfile(data.profile);
          setForm(data.profile);
          setMode('view');
        } else {
          setProfile(null);
          setMode('empty');
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const method = profile ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(`${API_BASE}/profiles/mentee`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        setMessage(profile ? 'Profile updated successfully!' : 'Profile created successfully!');
        await fetchProfile();
        setMode('view');
      } else {
        const error = await res.json();
        setMessage(error.detail || 'Failed to save profile');
      }
    } catch (err) {
      setMessage('Failed to save profile');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your profile?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/profiles/mentee`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setMessage('Profile deleted successfully!');
        setProfile(null);
        setForm({
          name: '',
          goals: '',
          background: ''
        });
        setMode('empty');
      }
    } catch (err) {
      setMessage('Failed to delete profile');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (mode === 'empty') {
    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        <div className="profile-empty">
          <div className="profile-empty-icon" aria-hidden="true">👤</div>
          <h2>No profile yet</h2>
          <p>Add your profile to start booking sessions with mentors.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setMessage('');
              setMode('create');
            }}
          >
            Add Your Profile
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'view' && profile) {
    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        <div className="profile-card">
          <h2 className="profile-card-title">{profile.name}</h2>
          <div className="profile-card-row"><strong>Goals:</strong> {profile.goals}</div>
          <div className="profile-card-row"><strong>Background:</strong> {profile.background}</div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setMessage('');
                setMode('edit');
              }}
            >
              Edit Profile
            </button>
            <button type="button" onClick={handleDelete} className="btn-danger">
              Delete Profile
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEditing = mode === 'edit' && profile;

  return (
    <div className="profile-page">
      <h1>{isEditing ? 'Edit Mentee Profile' : 'Create Mentee Profile'}</h1>
      
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Goals *</label>
          <textarea
            required
            rows="4"
            placeholder="What do you want to learn or achieve?"
            value={form.goals}
            onChange={(e) => setForm({ ...form, goals: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Background *</label>
          <textarea
            required
            rows="4"
            placeholder="Tell us about your current background and experience..."
            value={form.background}
            onChange={(e) => setForm({ ...form, background: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isEditing ? 'Update Profile' : 'Create Profile'}
          </button>
          {isEditing && (
            <button type="button" onClick={handleDelete} className="btn-danger">
              Delete Profile
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMessage('');
              setMode(profile ? 'view' : 'empty');
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
