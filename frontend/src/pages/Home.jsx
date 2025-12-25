import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Connect. Learn. Grow.</h1>
          <p className="hero-subtitle">
            The Engineering-Focused Mentorship Platform
          </p>
          <p className="hero-description">
            Bridging the gap between experienced engineers and aspiring professionals 
            through meaningful 1-to-1 mentoring sessions
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </section>

      <section className="problem-section">
        <div className="section-content">
          <h2>The Challenge We're Solving</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🎓</div>
              <h3>For Students & Early-Career Professionals</h3>
              <p>
                Engineering students and early-career professionals lack access to 
                practical, industry-experienced mentors who can provide real-world guidance.
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">💸</div>
              <h3>Generic & Expensive Platforms</h3>
              <p>
                Existing platforms are either too generic, prohibitively expensive, 
                or not focused on engineering disciplines.
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">👥</div>
              <h3>Untapped Mentor Potential</h3>
              <p>
                Senior engineers are willing to mentor but lack a trusted, 
                simple platform to monetize their time flexibly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="solution-section">
        <div className="section-content">
          <h2>Our Solution</h2>
          <p className="section-intro">
            A web-based platform designed specifically for the engineering community
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>For Experienced Engineers</h3>
              <p>Register as a mentor and share your expertise</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>For Mentees</h3>
              <p>Search and book 1-to-1 mentoring sessions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Seamless Scheduling</h3>
              <p>Easy booking and session management</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💳</div>
              <h3>Secure Payments</h3>
              <p>Integrated payment processing</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Trusted Environment</h3>
              <p>Engineering-focused community</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Free to Start</h3>
              <p>Initially free, with monetization coming later</p>
            </div>
          </div>
        </div>
      </section>

      <section className="value-section">
        <div className="section-content">
          <h2>Why Join Our Platform?</h2>
          <div className="value-grid">
            <div className="value-column">
              <h3>For Mentors</h3>
              <ul className="value-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Earn Income</strong>
                    <p>Share your expertise and get paid for your time</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Flexible Scheduling</strong>
                    <p>Set your own availability and rates</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>No Upfront Cost</strong>
                    <p>Free to join initially</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Build Your Brand</strong>
                    <p>Gain visibility and establish your professional reputation</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="value-column">
              <h3>For Mentees</h3>
              <ul className="value-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Affordable Access</strong>
                    <p>Real industry experience without breaking the bank</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Engineering-Specific Guidance</strong>
                    <p>Domain experts who understand your field</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Career Clarity</strong>
                    <p>Get direction on your engineering career path</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Technical Confidence</strong>
                    <p>Build skills with guidance from experienced professionals</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="target-section">
        <div className="section-content">
          <h2>Who We Serve</h2>
          <div className="target-grid">
            <div className="target-column">
              <h3>Mentors</h3>
              <ul>
                <li>Senior Engineers</li>
                <li>Engineering Managers</li>
                <li>Technical Specialists</li>
              </ul>
            </div>
            <div className="target-column">
              <h3>Mentees</h3>
              <ul>
                <li>Final-Year Engineering Students</li>
                <li>Graduate Engineers</li>
                <li>Career Switchers into Technology</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-content">
          <h2>Ready to Transform Your Career?</h2>
          <p>
            Join our platform today and connect with experienced engineering professionals 
            who can help you achieve your goals.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Create Your Account
            </Link>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'white', textDecoration: 'underline', fontWeight: 'bold' }}>
              Login here
            </Link>
          </p>
        </div>
      </section>

      <footer className="home-footer">
        <p>&copy; 2025 Mentor Platform. Building the future of engineering mentorship.</p>
      </footer>
    </div>
  );
}
