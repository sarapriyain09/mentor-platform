import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">
          <img src="/icon.svg" alt="Mentor Platform" className="nav-logo" />
          <span>Mentor Platform</span>
        </Link>
      </div>
      {user ? (
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          {user.role === 'mentee' && (
            <Link 
              to="/ai-match"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontWeight: '600'
              }}
            >
              🤖 AI Match
            </Link>
          )}
          <Link to="/mentors">Find Mentors</Link>
          <Link to="/bookings">📅 Bookings</Link>
          <Link to="/requests">My Requests</Link>
          {user.role === 'mentor' && <Link to="/profile/mentor">My Profile</Link>}
          {user.role === 'mentee' && <Link to="/profile/mentee">My Profile</Link>}
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  );
}
