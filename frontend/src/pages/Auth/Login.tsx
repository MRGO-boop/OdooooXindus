// @ts-nocheck
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validators';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);
    const result = login(email, password);
    if (!result.success) return setError(result.error);
    navigate('/dashboard');
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
          <div className="auth-logo">
            <svg width="36" height="36" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="14,1 25.26,7.5 25.26,20.5 14,27 2.74,20.5 2.74,7.5" fill="url(#hexGradLogin)" />
              <polygon points="14,1 25.26,7.5 25.26,20.5 14,27 2.74,20.5 2.74,7.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <text x="14" y="17" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif" letterSpacing="0.5">SS</text>
              <defs>
                <linearGradient id="hexGradLogin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1><span style={{color:'var(--text-primary)'}}>Stay </span><span style={{color:'var(--accent-primary)'}}>Subed</span></h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input type="email" className="form-input auth-input" placeholder="admin@subflow.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} className="form-input auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="auth-links-row">
            <Link to="/reset-password" className="auth-link-sm">Forgot password?</Link>
          </div>
          <button type="submit" className="btn btn-primary auth-btn">Sign In</button>
          <p className="auth-footer-text">
            Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
          </p>
          <div className="auth-demo-info">
            <strong>Demo Accounts:</strong><br/>
            Admin: admin@subflow.com / Admin@123<br/>
            Internal: sarah@subflow.com / Sarah@123<br/>
            Portal: john@example.com / John@1234
          </div>
        </form>
      </div>
    </div>
  );
}
