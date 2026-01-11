import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/blog" className="footer-link">Blog</Link>
          <span className="footer-separator">•</span>
          <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
          <span className="footer-separator">•</span>
          <Link to="/terms-of-service" className="footer-link">Terms of Service</Link>
          <span className="footer-separator">•</span>
          <Link to="/privacy-policy#gdpr" className="footer-link">GDPR</Link>
        </div>
        <div className="footer-copyright">
          © {currentYear} MendForWorks. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
