import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="auth-shape auth-shape-1"></div>
        <div className="auth-shape auth-shape-2"></div>
        <div className="auth-shape auth-shape-3"></div>
      </div>
      <div className="auth-card animate-in">
        <div className="auth-header">
          <div className="auth-logo"><Zap size={24} /></div>
          <h1>Reset Password</h1>
          <p>We'll send a reset link to your email</p>
        </div>
        {sent ? (
          <div className="auth-success">
            <CheckCircle size={48} />
            <h3>Email Sent!</h3>
            <p>Check your inbox for the reset link.</p>
            <Link to="/login" className="btn btn-primary auth-btn" style={{ marginTop: 16 }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input type="email" className="form-input auth-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-btn">Send Reset Link</button>
            <p className="auth-footer-text">
              Remember your password? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
