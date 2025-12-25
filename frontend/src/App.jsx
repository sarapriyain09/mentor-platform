import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './pages/Dashboard';
import MentorProfile from './pages/MentorProfile';
import MenteeProfile from './pages/MenteeProfile';
import MentorList from './pages/MentorList';
import Requests from './pages/Requests';
import AIIntakeFlow from './pages/AIIntakeFlow';
import Bookings from './pages/Bookings';
import BookMentor from './pages/BookMentor';
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
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="/ai-match" element={
              <ProtectedRoute>
                <AIIntakeFlow />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="/book-mentor/:mentorId" element={
              <ProtectedRoute>
                <BookMentor />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
