import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function MentorProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    domains: '',
    skills: '',
    years_experience: 0,
    bio: '',
    hourly_rate: 0,
    availability: ''
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
      const res = await fetch('http://127.0.0.1:8000/profiles/me', {
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
      const res = await fetch('http://127.0.0.1:8000/profiles/mentor', {
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
      const res = await fetch('http://127.0.0.1:8000/profiles/mentor', {
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
      <h1>{profile ? 'Edit Mentor Profile' : 'Create Mentor Profile'}</h1>
      
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Domains *</label>
          <input
            type="text"
            required
            placeholder="e.g., Tech, Business, Design"
            value={form.domains}
            onChange={(e) => setForm({ ...form, domains: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Skills *</label>
          <input
            type="text"
            required
            placeholder="e.g., Python, React, Machine Learning"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years of Experience *</label>
            <input
              type="number"
              required
              min="0"
              value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Hourly Rate ($) *</label>
            <input
              type="number"
              required
              min="0"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Availability *</label>
          <input
            type="text"
            required
            placeholder="e.g., Weekdays 6pm-9pm, Weekends"
            value={form.availability}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Bio *</label>
          <textarea
            required
            rows="5"
            placeholder="Tell us about yourself and your mentoring experience..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
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
