import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './pages/Dashboard';
import MentorProfile from './pages/MentorProfile';
import MenteeProfile from './pages/MenteeProfile';
import MentorList from './pages/MentorList';
import Requests from './pages/Requests';
import Navbar from './components/Navbar';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role) {
      setUser({ role });
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar user={user} setUser={setUser} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/profile/mentor" element={
              <ProtectedRoute>
                <MentorProfile />
              </ProtectedRoute>
            } />
            <Route path="/profile/mentee" element={
              <ProtectedRoute>
                <MenteeProfile />
              </ProtectedRoute>
            } />
            <Route path="/mentors" element={
              <ProtectedRoute>
                <MentorList />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
