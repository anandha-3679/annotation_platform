import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Activity,
  ShieldCheck,
  Layers,
  Zap,
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  Brain,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Landing() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchDemo = async () => {
    setDemoLoading(true);
    try {
      await signIn('radiologist@medora.health', 'demo-password-123');
      navigate('/dashboard');
    } catch {
      // Fallback: DEFAULT_DEMO_USER is already active in AuthProvider
      navigate('/dashboard');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Top Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src="/logo.jpg"
              alt="MEDORA"
              style={{ width: '34px', height: '34px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              MEDORA
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '14px', fontWeight: 500 }}>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#workflow" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Workflow
            </a>
            <a href="#active-learning" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Active Learning
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/login"
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textDecoration: 'none',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface)',
              }}
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--gradient-canva)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-canva)',
              }}
            >
              <Stethoscope size={16} />
              <span>{demoLoading ? 'Launching...' : user ? 'Open Dashboard' : 'Launch Demo'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '72px 24px 64px',
          background: 'radial-gradient(circle at 50% 0%, rgba(124, 58, 237, 0.12) 0%, transparent 65%)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              color: 'var(--primary-700)',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} />
            <span>AI-Assisted Clinical Annotation & Active Learning</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              margin: '0 auto 20px',
              maxWidth: '820px',
            }}
          >
            Where Human Expertise Refines{' '}
            <span
              style={{
                background: 'var(--gradient-canva)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Clinical AI
            </span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              margin: '0 auto 36px',
            }}
          >
            The next-generation chest X-ray annotation workstation. Inspect U-Net predictions,
            refine segmentation masks on a sub-millimeter Konva canvas, and close the active learning loop.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              style={{
                padding: '14px 26px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                color: '#ffffff',
                background: 'var(--gradient-canva)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-canva)',
              }}
            >
              <span>{demoLoading ? 'Signing into Demo...' : 'Try Live Demo'}</span>
              <ArrowRight size={18} />
            </button>

            <Link
              to="/signup"
              style={{
                padding: '14px 24px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>Create Account</span>
            </Link>
          </div>

          <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Demo opens directly into Dr. Anandha Lakshmi&apos;s pre-loaded radiologist workspace.
          </p>

          {/* Workstation Preview Card */}
          <div
            style={{
              marginTop: '48px',
              background: '#0f172a',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.28)',
              textAlign: 'left',
              color: '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  medora.health/dashboard — Cardiothoracic Imaging
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  fontWeight: 600,
                }}
              >
                Active Learning Ready
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Pending Review</div>
                <div style={{ fontSize: '26px', fontWeight: 800 }}>24 Scans</div>
                <div style={{ fontSize: '12px', color: '#a78bfa', marginTop: '4px' }}>High-uncertainty queue</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Model Dice Score</div>
                <div style={{ fontSize: '26px', fontWeight: 800 }}>0.914</div>
                <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>+3.2% after last cycle</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Annotation Speed</div>
                <div style={{ fontSize: '26px', fontWeight: 800 }}>4.2x Faster</div>
                <div style={{ fontSize: '12px', color: '#f472b6', marginTop: '4px' }}>U-Net pre-labeling</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '64px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Built for Clinical Precision
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Everything radiologists and ML teams need in one unified workstation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {[
            {
              icon: <Layers size={22} color="var(--primary-600)" />,
              title: 'Multi-Layer Konva Canvas',
              desc: 'Sub-millimeter polygon, brush, and bounding-box tools with window/level presets.',
            },
            {
              icon: <Brain size={22} color="#ec4899" />,
              title: 'AI Pre-Labeling',
              desc: 'Instant U-Net segmentation overlays so clinicians refine instead of drawing from scratch.',
            },
            {
              icon: <Activity size={22} color="#10b981" />,
              title: 'Active Learning Loop',
              desc: 'Automatically surfaces high-uncertainty scans for review to maximize model improvement.',
            },
            {
              icon: <ShieldCheck size={22} color="#0ea5e9" />,
              title: 'Audit & Guidelines',
              desc: 'Standardized clinical annotation guidelines and role-based access control.',
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section
        id="workflow"
        style={{
          padding: '64px 24px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>
              3-Step Clinical Workflow
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              From raw DICOM/X-ray upload to production-ready segmentation models.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {[
              {
                step: '01',
                icon: <ScanLine size={20} color="var(--primary-600)" />,
                title: 'Upload & Prioritize',
                desc: 'Ingest chest X-ray studies and let uncertainty sampling rank the most informative cases.',
              },
              {
                step: '02',
                icon: <Zap size={20} color="var(--primary-600)" />,
                title: 'Inspect & Refine',
                desc: 'Review AI-generated masks on the Konva canvas and adjust boundaries in seconds.',
              },
              {
                step: '03',
                icon: <CheckCircle2 size={20} color="var(--primary-600)" />,
                title: 'Approve & Retrain',
                desc: 'Submit verified annotations back into the active learning pipeline to boost accuracy.',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-600)' }}>STEP {item.step}</span>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Learning CTA */}
      <section id="active-learning" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            padding: '44px 28px',
            borderRadius: '16px',
            background: 'var(--gradient-canva)',
            color: '#ffffff',
            boxShadow: 'var(--shadow-canva)',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px' }}>
            Ready to explore the MEDORA Workstation?
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.92, maxWidth: '540px', margin: '0 auto 28px' }}>
            Jump straight into the live demo dashboard or sign in with your own radiologist account.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleLaunchDemo}
              disabled={demoLoading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                background: '#ffffff',
                color: 'var(--primary-700)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {demoLoading ? 'Launching...' : 'Launch Demo Dashboard'}
            </button>
            <Link
              to="/login"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.16)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.35)',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '24px',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        MEDORA Radiologist Workstation © 2026 · Built for Clinical AI & Active Learning
      </footer>
    </div>
  );
}

