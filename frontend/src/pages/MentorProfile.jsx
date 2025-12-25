import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import './Profile.css';

const DOMAIN_OPTIONS = [
  'Engineering',
  'Technology',
  'Business',
  'Design',
  'Leadership',
  'Career',
  'Data',
  'Marketing',
  'Finance',
  'Product',
  'Other'
];

const MAX_BIO_WORDS = 120;

function clampWords(text, maxWords) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(text || '');
  return words.slice(0, maxWords).join(' ');
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function domainOptionsFor(current) {
  const value = String(current || '').trim();
  if (!value) return DOMAIN_OPTIONS;
  return DOMAIN_OPTIONS.includes(value) ? DOMAIN_OPTIONS : [value, ...DOMAIN_OPTIONS];
}

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
      const res = await fetch(`${API_BASE}/profiles/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setForm({
            ...data.profile,
            bio: clampWords(data.profile.bio, MAX_BIO_WORDS),
          });
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

    const payload = {
      ...form,
      bio: clampWords(form.bio, MAX_BIO_WORDS),
    };
    
    try {
      const res = await fetch(`${API_BASE}/profiles/mentor`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
      const res = await fetch(`${API_BASE}/profiles/mentor`, {
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
          <select
            required
            value={form.domains}
            onChange={(e) => setForm({ ...form, domains: e.target.value })}
          >
            <option value="" disabled>Select a domain</option>
            {domainOptionsFor(form.domains).map((domain) => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
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
          <div className="help-text">Use comma-separated skills.</div>
          {splitList(form.skills).length > 0 && (
            <div className="skill-tags" aria-label="skills preview">
              {splitList(form.skills).map((skill) => (
                <span key={skill} className="skill-tag" title={skill}>{skill}</span>
              ))}
            </div>
          )}
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
            className="bio-textarea"
            placeholder="Tell us about yourself and your mentoring experience..."
            value={form.bio}
            onChange={(e) => {
              const next = clampWords(e.target.value, MAX_BIO_WORDS);
              setForm({ ...form, bio: next });
            }}
          />
          <div className="help-text">
            {countWords(form.bio)} / {MAX_BIO_WORDS} words
          </div>
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
