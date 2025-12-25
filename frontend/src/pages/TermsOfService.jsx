import './Legal.css';

export default function TermsOfService() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-GB')}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using MendForWorks ("the Platform"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            MendForWorks is an online mentoring platform that connects mentees with experienced mentors. 
            We provide tools for scheduling sessions, processing payments, and facilitating mentor-mentee relationships.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <h3>3.1 Registration</h3>
          <p>
            You must create an account to use our services. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>

          <h3>3.2 Age Requirement</h3>
          <p>
            You must be at least 18 years old to use this Platform.
          </p>

          <h3>3.3 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms or engage in inappropriate behavior.
          </p>
        </section>

        <section>
          <h2>4. User Roles</h2>
          <h3>4.1 Mentors</h3>
          <p>As a mentor, you agree to:</p>
          <ul>
            <li>Provide accurate information about your skills and experience</li>
            <li>Honor scheduled sessions or provide adequate notice of cancellation</li>
            <li>Conduct yourself professionally and respectfully</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h3>4.2 Mentees</h3>
          <p>As a mentee, you agree to:</p>
          <ul>
            <li>Attend scheduled sessions or provide adequate notice of cancellation</li>
            <li>Pay for booked sessions according to the agreed terms</li>
            <li>Treat mentors with respect and professionalism</li>
            <li>Use the platform for legitimate mentoring purposes only</li>
          </ul>
        </section>

        <section>
          <h2>5. Payments and Fees</h2>
          <h3>5.1 Session Payments</h3>
          <p>
            Mentees pay for sessions at the rate set by mentors. All payments are processed securely through Stripe.
          </p>

          <h3>5.2 Platform Commission</h3>
          <p>
            MendForWorks charges a 10% commission on each completed session. Mentors receive 90% of the session fee.
          </p>

          <h3>5.3 Refund Policy</h3>
          <ul>
            <li>Cancellations 24+ hours before session: Full refund</li>
            <li>Cancellations within 24 hours: 50% refund</li>
            <li>No-shows: No refund</li>
          </ul>
          <p>Mentor-initiated cancellations: Full refund to mentee</p>

          <h3>5.4 Payout Schedule</h3>
          <p>
            Mentor payouts are processed within 7-14 business days after session completion.
          </p>
        </section>

        <section>
          <h2>6. Prohibited Conduct</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Harass, abuse, or harm other users</li>
            <li>Share false or misleading information</li>
            <li>Impersonate others or misrepresent your identity</li>
            <li>Attempt to circumvent payment systems</li>
            <li>Use the platform for illegal activities</li>
            <li>Scrape or collect user data without permission</li>
            <li>Interfere with the platform's operation or security</li>
            <li>Arrange sessions outside the platform to avoid fees</li>
          </ul>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            All content, features, and functionality of the Platform are owned by MendForWorks and protected by copyright, 
            trademark, and other intellectual property laws.
          </p>
          <p>
            You retain ownership of content you create, but grant us a license to use it for operating the platform.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
            We do not guarantee:
          </p>
          <ul>
            <li>The quality or outcome of mentoring relationships</li>
            <li>Uninterrupted or error-free service</li>
            <li>The accuracy of user-provided information</li>
            <li>Security against all potential threats</li>
          </ul>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MendForWorks SHALL NOT BE LIABLE FOR:
          </p>
          <ul>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Actions or inactions of users on the platform</li>
            <li>Any amount exceeding fees paid in the last 12 months</li>
          </ul>
        </section>

        <section>
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold MendForWorks harmless from any claims, losses, or damages arising from:
          </p>
          <ul>
            <li>Your violation of these Terms</li>
            <li>Your use of the Platform</li>
            <li>Your violation of any rights of another party</li>
          </ul>
        </section>

        <section>
          <h2>11. Privacy</h2>
          <p>
            Your use of the Platform is also governed by our <a href="/privacy-policy">Privacy Policy</a>, 
            which explains how we collect, use, and protect your personal data.
          </p>
        </section>

        <section>
          <h2>12. Dispute Resolution</h2>
          <h3>12.1 Governing Law</h3>
          <p>
            These Terms are governed by the laws of England and Wales.
          </p>

          <h3>12.2 Disputes Between Users</h3>
          <p>
            Disputes between mentors and mentees should first be resolved directly. If unresolved, you may contact our support team.
          </p>

          <h3>12.3 Arbitration</h3>
          <p>
            Any disputes with MendForWorks shall be resolved through binding arbitration, except where prohibited by law.
          </p>
        </section>

        <section>
          <h2>13. Modifications to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new Terms. 
            We will notify you of material changes via email or platform notification.
          </p>
        </section>

        <section>
          <h2>14. Termination</h2>
          <p>
            You may terminate your account at any time by contacting support. We may terminate or suspend accounts for violations of these Terms. 
            Upon termination, you remain liable for any outstanding payments.
          </p>
        </section>

        <section>
          <h2>15. Severability</h2>
          <p>
            If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full effect.
          </p>
        </section>

        <section>
          <h2>16. Contact Information</h2>
          <p>
            For questions about these Terms of Service, contact us at:
          </p>
          <p>
            Email: <a href="mailto:legal@mendforworks.com">legal@mendforworks.com</a><br />
            Support: <a href="mailto:contact@mendforworks.com">contact@mendforworks.com</a>
          </p>
        </section>

        <section>
          <p className="legal-notice">
            By using MendForWorks, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </section>
      </div>
    </div>
  );
}
