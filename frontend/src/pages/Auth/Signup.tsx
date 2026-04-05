// @ts-nocheck
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword } from '../../utils/validators';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    if (password !== confirm) return setError('Passwords do not match');
    const result = signup(name, email, password, 'portal');
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
              <polygon points="14,1 25.26,7.5 25.26,20.5 14,27 2.74,20.5 2.74,7.5" fill="url(#hexGradSignup)" />
              <polygon points="14,1 25.26,7.5 25.26,20.5 14,27 2.74,20.5 2.74,7.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <text x="14" y="17" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif" letterSpacing="0.5">SS</text>
              <defs>
                <linearGradient id="hexGradSignup" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1><span style={{color:'var(--text-primary)'}}>Stay </span><span style={{color:'var(--accent-primary)'}}>Subed</span></h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input type="text" className="form-input auth-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input type="email" className="form-input auth-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
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
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} className="form-input auth-input" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-btn">Create Account</button>
          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
