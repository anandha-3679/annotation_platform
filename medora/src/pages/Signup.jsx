import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Radiologist');
  const [hospital, setHospital] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, {
        full_name: fullName,
        role: role,
        hospital: hospital,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
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
            Empower Radiologists with Intelligent Workflows <span className="hero-sparkle">✦</span>
          </h1>
          <p className="auth-hero-desc">
            Join thousands of clinical specialists collaborating with machine learning teams.
            Review AI segmentations, refine diagnostic accuracy, and accelerate reporting.
          </p>

          <div className="auth-feature-pills">
            <div className="auth-feature-pill">
              <CheckCircle size={18} color="#34d399" />
              <span>Direct feedback pipeline into PyTorch active learning models</span>
            </div>
            <div className="auth-feature-pill">
              <Sparkles size={18} color="#a78bfa" />
              <span>Interactive multi-pathology mask drawing & eraser</span>
            </div>
            <div className="auth-feature-pill">
              <Shield size={18} color="#38bdf8" />
              <span>Enterprise role-based access control</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          MEDORA Clinical AI Systems © 2026.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Create Specialist Account</h2>
            <p>Set up your profile to access DICOM studies and annotation tools</p>
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name & Title</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Dr. Anandha Lakshmi, MD"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Email</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="doctor@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Radiologist">Radiologist</option>
                  <option value="Resident">Radiology Resident</option>
                  <option value="ML Engineer">ML Engineer</option>
                  <option value="Admin">Clinical Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital / Center</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Apex Medical"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gradient"
              style={{ padding: '12px', fontSize: '15px', marginTop: '6px' }}
            >
              {loading ? 'Creating Workspace...' : 'Register Specialist Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
