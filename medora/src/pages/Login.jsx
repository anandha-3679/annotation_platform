import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Activity, ArrowRight, Stethoscope } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signIn('radiologist@medora.health', 'demo-password-123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Canva Hero Panel */}
      <div className="auth-hero-panel">
        <div className="auth-brand-badge">
          <img src="/logo.jpg" alt="MEDORA Logo" className="auth-brand-logo" />
          <span className="auth-brand-text">MEDORA</span>
        </div>

        <div className="auth-hero-content">
          <h1 className="auth-hero-headline">
            Where Human Expertise Refines Clinical AI <span className="hero-sparkle">✦</span>
          </h1>
          <p className="auth-hero-desc">
            The next-generation chest X-ray annotation workstation. Inspect AI masks,
            edit segmentations in seconds, and close the active learning loop with your AI engineers.
          </p>

          <div className="auth-feature-pills">
            <div className="auth-feature-pill">
              <Activity size={18} color="#a78bfa" />
              <span>Multi-layer Konva canvas with sub-millimeter precision</span>
            </div>
            <div className="auth-feature-pill">
              <Sparkles size={18} color="#ec4899" />
              <span>Uncertainty estimation & active learning feedback pipeline</span>
            </div>
            <div className="auth-feature-pill">
              <ShieldCheck size={18} color="#34d399" />
              <span>Supabase RLS & HIPAA-grade audit logging</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          MEDORA Radiologist Workstation © 2026. Empowered by Active Learning.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your radiologist workspace and studies</p>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDemoLogin}
            style={{
              padding: '12px',
              border: '1.5px dashed var(--primary-500)',
              background: 'var(--primary-50)',
              color: 'var(--primary-800)',
              fontWeight: 700,
            }}
          >
            <Stethoscope size={18} color="var(--primary-600)" />
            <span>1-Click Radiologist Demo Login</span>
          </button>

          <div className="auth-divider">or continue with email</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Hospital Email</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <a href="#forgot" style={{ fontSize: '12px', color: 'var(--primary-600)', textDecoration: 'none' }}>
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gradient"
              style={{ padding: '12px', fontSize: '15px', marginTop: '8px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Need an institutional account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
