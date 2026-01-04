import { API_BASE } from "../api";
import "../Auth.css";

export default function SocialAuthButtons({ intent = "login", role }) {
  const startSocialLogin = (provider) => {
    const redirect = `${window.location.origin}/oauth/callback`;
    const params = new URLSearchParams({ redirect, intent });
    if (role) {
      params.append("role", role.toLowerCase());
    }
    window.location.href = `${API_BASE}/auth/oauth/${provider}/start?${params.toString()}`;
  };

  return (
    <div className="social-auth">
      <p className="social-label">Or continue with</p>
      <div className="social-buttons">
        <button
          type="button"
          className="btn-social btn-google"
          onClick={() => startSocialLogin("google")}
        >
          Continue with Google
        </button>
        <button
          type="button"
          className="btn-social btn-linkedin"
          onClick={() => startSocialLogin("linkedin")}
        >
          Continue with LinkedIn
        </button>
      </div>
    </div>
  );
}
