import './Legal.css';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to MendForWorks ("we", "our", or "us"). We are committed to protecting your personal data and respecting your privacy. 
            This Privacy Policy explains how we collect, use, and protect your information when you use our mentoring platform.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Information You Provide</h3>
          <ul>
            <li>Account information (name, email address, password)</li>
            <li>Profile information (skills, experience, background, goals)</li>
            <li>Communication data (messages between mentors and mentees)</li>
            <li>Booking and session information</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Feedback and ratings</li>
          </ul>

          <h3>2.2 Information We Collect Automatically</h3>
          <ul>
            <li>Usage data (pages visited, features used)</li>
            <li>Device information (browser type, IP address)</li>
            <li>Cookies and similar technologies</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your personal data to:</p>
          <ul>
            <li>Provide and improve our mentoring services</li>
            <li>Match mentees with suitable mentors using AI</li>
            <li>Process payments and bookings</li>
            <li>Communicate with you about your account and services</li>
            <li>Send important updates and notifications</li>
            <li>Ensure platform security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal Basis for Processing (GDPR)</h2>
          <p>Under GDPR, we process your data based on:</p>
          <ul>
            <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
            <li><strong>Consent:</strong> When you give explicit permission (e.g., marketing emails)</li>
            <li><strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
            <li><strong>Legal Obligation:</strong> To comply with UK law</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Sharing</h2>
          <p>We do not sell your personal data. We may share your information with:</p>
          <ul>
            <li><strong>Other Users:</strong> Your profile is visible to mentors/mentees on the platform</li>
            <li><strong>Service Providers:</strong> Stripe (payments), Render (hosting), email providers</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights (GDPR)</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Limit how we use your data</li>
            <li><strong>Data Portability:</strong> Receive your data in a structured format</li>
            <li><strong>Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> At any time, where consent is the legal basis</li>
          </ul>
          <p>
            To exercise these rights, contact us at <a href="mailto:privacy@mendforworks.com">privacy@mendforworks.com</a>
          </p>
        </section>

        <section>
          <h2>7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your data, including:
          </p>
          <ul>
            <li>Encryption of data in transit (HTTPS/SSL)</li>
            <li>Secure password hashing (bcrypt)</li>
            <li>Regular security updates and monitoring</li>
            <li>Access controls and authentication</li>
          </ul>
        </section>

        <section>
          <h2>8. Data Retention</h2>
          <p>
            We retain your personal data only as long as necessary for the purposes outlined in this policy or as required by law. 
            When you delete your account, we will delete or anonymize your data within 30 days, except where we must retain it for legal compliance.
          </p>
        </section>

        <section>
          <h2>9. International Transfers</h2>
          <p>
            Your data is primarily stored in the UK/EU. If we transfer data outside these regions, we ensure adequate protection 
            through approved mechanisms such as Standard Contractual Clauses.
          </p>
        </section>

        <section>
          <h2>10. Cookies</h2>
          <p>
            We use essential cookies to enable core functionality (e.g., authentication). We do not use tracking or advertising cookies. 
            You can control cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2>11. Children's Privacy</h2>
          <p>
            Our service is not intended for users under 18 years of age. We do not knowingly collect data from children.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the platform.
          </p>
        </section>

        <section>
          <h2>13. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights, contact us at:
          </p>
          <p>
            Email: <a href="mailto:privacy@mendforworks.com">privacy@mendforworks.com</a><br />
            Data Protection Officer: <a href="mailto:dpo@mendforworks.com">dpo@mendforworks.com</a>
          </p>
        </section>

        <section>
          <h2>14. Supervisory Authority</h2>
          <p>
            You have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) if you believe 
            we have not handled your data properly:
          </p>
          <p>
            ICO Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">https://ico.org.uk</a><br />
            Phone: 0303 123 1113
          </p>
        </section>
      </div>
    </div>
  );
}
