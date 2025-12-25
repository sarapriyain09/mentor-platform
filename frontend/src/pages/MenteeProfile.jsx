import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './Profile.css';

export default function MenteeProfile() {
  const [profile, setProfile] = useState(null);
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
        setTimeout(() => navigate('/dashboard'), 2000);
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
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setMessage('Failed to delete profile');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">
      <h1>{profile ? 'Edit Mentee Profile' : 'Create Mentee Profile'}</h1>
      
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
            {profile ? 'Update Profile' : 'Create Profile'}
          </button>
          {profile && (
            <button type="button" onClick={handleDelete} className="btn-danger">
              Delete Profile
            </button>
          )}
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
