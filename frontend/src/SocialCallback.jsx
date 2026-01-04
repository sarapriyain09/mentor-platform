import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function SocialCallback({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const error = params.get("error");

    if (token) {
      localStorage.setItem("token", token);
      if (role) {
        localStorage.setItem("role", role);
        if (setUser) {
          setUser({ role });
        }
      }
      navigate("/dashboard", { replace: true });
      return;
    }

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate, setUser]);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Finishing secure sign in...</h2>
        <p>Please wait while we finalize your account.</p>
      </div>
    </div>
  );
}
