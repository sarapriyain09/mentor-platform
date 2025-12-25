import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "./api";
import './Auth.css';

export default function Login({ setUser }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginUser(form);
      if (res.access_token) {
        localStorage.setItem("token", res.access_token);
        if (res.role) {
          localStorage.setItem("role", res.role);
          setUser({ role: res.role });
        }
        navigate("/dashboard");
      } else {
        setError(res.detail || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <input 
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input 
            placeholder="Password" 
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" className="btn-primary">Login</button>
        </form>
        <p className="auth-link">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
