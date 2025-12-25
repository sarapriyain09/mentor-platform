import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Find the right mentor. Even when you don't know where to start.</h1>
          <p className="hero-description">
            We help you discover your true needs, guide you with AI, and connect you with 
            experienced human mentors who help you grow—personally and professionally.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Start Your Mentoring Journey</Link>
          </div>
        </div>
      </section>

      <section className="problem-section">
        <div className="section-content">
          <h2>Why We Exist</h2>
          <p className="section-intro">
            Many people want a mentor—but don't know what kind of mentor they need, 
            what goals to work on, or where to begin. We exist to bridge that gap.
          </p>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🎯</div>
              <h3>AI-Guided Discovery</h3>
              <p>
                Our AI guide asks thoughtful questions to help you clarify your goals, 
                challenges, and aspirations.
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🤝</div>
              <h3>Thoughtful Matching</h3>
              <p>
                Based on your clarity and preferences, we connect you with mentors who 
                genuinely align with your journey.
              </p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📈</div>
              <h3>Continuous Growth</h3>
              <p>
                Mentoring doesn't end with a session. We support you with reflection prompts, 
                progress tracking, and guidance between conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="solution-section">
        <div className="section-content">
          <h2>What Makes Us Different</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Human-First Mentoring</h3>
              <p>Technology supports the journey—but growth happens through meaningful human connections</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI That Guides, Not Replaces</h3>
              <p>Our AI helps you think clearly, prepare better, and get more value from every conversation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Outcome-Focused</h3>
              <p>We focus on clarity, confidence, and real progress—not just meetings on a calendar</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Built for Individuals</h3>
              <p>Whether you're starting your career or seeking growth, we meet you where you are</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Clarity Before Advice</h3>
              <p>Understand yourself first, then find the mentor who can guide you forward</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Reflection prompts and insights to help you measure and celebrate your growth</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Safe & Confidential</h3>
              <p>A trusted space where you can be vulnerable, ask questions, and explore without judgment</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Personalized Journey</h3>
              <p>Every mentoring relationship is unique—we adapt to your pace, style, and goals</p>
            </div>
          </div>
        </div>
      </section>

      <section className="value-section">
        <div className="section-content">
          <h2>Who We Help</h2>
          <div className="value-grid">
            <div className="value-column">
              <h3>For Mentees</h3>
              <ul className="value-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Career Starters & Early Professionals</strong>
                    <p>Finding your path and building confidence in your journey</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Career Switchers & Returners</strong>
                    <p>Navigating transitions with clarity and support</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Entrepreneurs & Founders</strong>
                    <p>Getting guidance through the challenges of building</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Anyone Feeling Stuck</strong>
                    <p>If you're uncertain or overwhelmed, we help you find clarity</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="value-column">
              <h3>Our Mentors</h3>
              <ul className="value-list">
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Deep Listeners</strong>
                    <p>Mentors who truly hear what you're going through</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Real-World Insight</strong>
                    <p>Experienced professionals who've walked the path</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Structured Guidance</strong>
                    <p>Thoughtful frameworks that drive meaningful progress</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>Long-Term Focus</strong>
                    <p>Mentors who care about your sustainable growth</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="target-section">
        <div className="section-content">
          <h2>Our Promise</h2>
          <div className="promise-box">
            <p className="promise-quote">
              "You don't need to have everything figured out. You just need a place to start."
            </p>
            <p className="promise-text">
              We'll help you find clarity, direction, and the right mentor to walk with you on your journey.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-content">
          <h2>Start With Clarity</h2>
          <p>
            Begin your journey with AI-guided discovery and connect with mentors 
            who truly understand your goals.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started Today
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
        <p>&copy; 2025 MendForWorks. Where clarity meets mentorship.</p>
      </footer>
    </div>
  );
}
