import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Package, Mail, Lock, User, Building2, KeyRound, ArrowRight, UserPlus, LogIn, ArrowLeft, ShieldCheck, CheckCircle2, Send } from 'lucide-react';
import api from '../api';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register-owner' | 'register-employee' | 'forgot' | 'email-sent' | 'reset' | 'reset-success'
  const [form, setForm] = useState({ email: '', password: '', name: '', businessName: '', inviteCode: '' });
  const [resetForm, setResetForm] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Check URL for reset token (from email link)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('/reset-password')) {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const token = params.get('token');
      if (token) {
        setResetForm(prev => ({ ...prev, token }));
        setMode('reset');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else if (mode === 'register-owner') {
        await register({ email: form.email, password: form.password, name: form.name, businessName: form.businessName });
      } else {
        await register({ email: form.email, password: form.password, name: form.name, inviteCode: form.inviteCode });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess(res.data.message);
      setMode('email-sent');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetForm.token,
        newPassword: resetForm.newPassword
      });
      setSuccess(res.data.message);
      setMode('reset-success');
      // Clean the URL
      window.location.hash = '#/login';
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setForgotEmail('');
    setResetForm({ token: '', newPassword: '', confirmPassword: '' });
    setForm({ email: '', password: '', name: '', businessName: '', inviteCode: '' });
    if (newMode === 'login') {
      window.location.hash = '#/login';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back! Sign in to continue.';
      case 'register-owner': return 'Create your business account';
      case 'register-employee': return 'Join your team';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'email-sent': return 'Check your inbox';
      case 'reset': return 'Create your new password';
      case 'reset-success': return 'Your password has been updated!';
      default: return '';
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shapes">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            {mode === 'reset-success' ? <CheckCircle2 size={28} /> :
             mode === 'email-sent' ? <Send size={28} /> :
             <Package size={28} />}
          </div>
          <h1>
            {mode === 'reset-success' ? 'Password Reset!' :
             mode === 'email-sent' ? 'Email Sent!' :
             'BizManager'}
          </h1>
          <p className="login-subtitle">{getSubtitle()}</p>
        </div>

        {error && (
          <div className="login-error">
            <span>{error}</span>
          </div>
        )}

        {success && mode !== 'reset-success' && mode !== 'email-sent' && (
          <div className="login-success">
            <span>{success}</span>
          </div>
        )}

        {/* ============ LOGIN / REGISTER FORM ============ */}
        {(mode === 'login' || mode === 'register-owner' || mode === 'register-employee') && (
          <form onSubmit={handleSubmit} className="login-form">
            {mode !== 'login' && (
              <div className="login-field">
                <User size={18} className="login-field-icon" />
                <input
                  type="text" placeholder="Full Name" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}

            <div className="login-field">
              <Mail size={18} className="login-field-icon" />
              <input
                type="email" placeholder="Email Address" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="login-field">
              <Lock size={18} className="login-field-icon" />
              <input
                type="password" placeholder="Password" required minLength={6}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {mode === 'register-owner' && (
              <div className="login-field">
                <Building2 size={18} className="login-field-icon" />
                <input
                  type="text" placeholder="Business Name" required
                  value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })}
                />
              </div>
            )}

            {mode === 'register-employee' && (
              <div className="login-field">
                <KeyRound size={18} className="login-field-icon" />
                <input
                  type="text" placeholder="Invite Code" required
                  value={form.inviteCode}
                  onChange={e => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
                />
              </div>
            )}

            {mode === 'login' && (
              <button
                type="button"
                className="login-forgot-link"
                onClick={() => switchMode('forgot')}
              >
                Forgot Password?
              </button>
            )}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <span className="login-spinner"></span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============ FORGOT PASSWORD FORM ============ */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="login-form">
            <div className="login-field">
              <Mail size={18} className="login-field-icon" />
              <input
                type="email" placeholder="Enter your registered email" required
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <span className="login-spinner"></span>
              ) : (
                <>
                  Send Reset Link
                  <Send size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============ EMAIL SENT CONFIRMATION ============ */}
        {mode === 'email-sent' && (
          <div className="login-email-sent">
            <div className="login-email-sent-icon">
              <Mail size={32} />
            </div>
            <p className="login-email-sent-text">
              We've sent a password reset link to <strong>{forgotEmail}</strong>
            </p>
            <p className="login-email-sent-hint">
              Check your inbox and spam folder. The link will expire in 15 minutes.
            </p>
            <button
              className="login-submit-btn"
              style={{ marginTop: '8px' }}
              onClick={() => switchMode('forgot')}
            >
              <Mail size={18} />
              Didn't receive it? Send again
            </button>
          </div>
        )}

        {/* ============ RESET PASSWORD FORM (from email link) ============ */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="login-reset-info">
              <ShieldCheck size={18} />
              <span>Enter your new password below</span>
            </div>

            <div className="login-field">
              <Lock size={18} className="login-field-icon" />
              <input
                type="password" placeholder="New Password" required minLength={6}
                value={resetForm.newPassword}
                onChange={e => setResetForm({ ...resetForm, newPassword: e.target.value })}
              />
            </div>

            <div className="login-field">
              <ShieldCheck size={18} className="login-field-icon" />
              <input
                type="password" placeholder="Confirm New Password" required minLength={6}
                value={resetForm.confirmPassword}
                onChange={e => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <span className="login-spinner"></span>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ============ RESET SUCCESS ============ */}
        {mode === 'reset-success' && (
          <div className="login-reset-success">
            <div className="login-success-icon-wrapper">
              <CheckCircle2 size={48} />
            </div>
            <p>{success}</p>
            <button
              className="login-submit-btn"
              onClick={() => switchMode('login')}
            >
              <LogIn size={18} />
              Sign In Now
            </button>
          </div>
        )}

        {/* ============ DIVIDER & ALT ACTIONS ============ */}
        {mode !== 'reset-success' && mode !== 'email-sent' && (
          <>
            <div className="login-divider">
              <span>or</span>
            </div>

            {mode === 'login' ? (
              <div className="login-alt-actions">
                <button className="login-alt-btn" onClick={() => switchMode('register-owner')}>
                  <Building2 size={16} />
                  Register as Business Owner
                </button>
                <button className="login-alt-btn" onClick={() => switchMode('register-employee')}>
                  <UserPlus size={16} />
                  Join as Employee (I have an invite code)
                </button>
              </div>
            ) : mode === 'forgot' || mode === 'reset' ? (
              <div className="login-alt-actions">
                <button className="login-alt-btn" onClick={() => switchMode('login')}>
                  <ArrowLeft size={16} />
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="login-alt-actions">
                <button className="login-alt-btn" onClick={() => switchMode('login')}>
                  <LogIn size={16} />
                  Already have an account? Sign In
                </button>
                {mode === 'register-owner' ? (
                  <button className="login-alt-btn" onClick={() => switchMode('register-employee')}>
                    <UserPlus size={16} />
                    Join as Employee instead
                  </button>
                ) : (
                  <button className="login-alt-btn" onClick={() => switchMode('register-owner')}>
                    <Building2 size={16} />
                    Register as Business Owner instead
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {mode === 'email-sent' && (
          <>
            <div className="login-divider">
              <span>or</span>
            </div>
            <div className="login-alt-actions">
              <button className="login-alt-btn" onClick={() => switchMode('login')}>
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
