import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "./api";
import './Auth.css';
import SocialAuthButtons from "./components/SocialAuthButtons";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "MENTEE",
  });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!gdprConsent) {
      setError("You must agree to the Privacy Policy and Terms of Service to register.");
      return;
    }
    
    try {
      const res = await registerUser(form);
      console.log("Registration response:", res); // Debug log
      if (res.id) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.detail || res.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err); // Debug log
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Register</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <SocialAuthButtons intent="register" role={form.role} />
        <p className="social-disabled-note">
          Social logins are temporarily unavailable. Please sign up with your email instead.
        </p>
        <form onSubmit={submit}>
          <input 
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input 
            placeholder="Full Name"
            type="text"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input 
            placeholder="Password" 
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select 
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="MENTEE">I'm looking for a mentor (Mentee)</option>
            <option value="MENTOR">I want to be a mentor (Mentor)</option>
          </select>
          
          <div className="gdpr-consent">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                required
              />
              <span>
                I agree to the <Link to="/privacy-policy" target="_blank">Privacy Policy</Link> and{' '}
                <Link to="/terms-of-service" target="_blank">Terms of Service</Link>
              </span>
            </label>
          </div>
          
          <button type="submit" className="btn-primary">Register</button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
