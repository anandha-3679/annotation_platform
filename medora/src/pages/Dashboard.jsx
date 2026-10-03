import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  PenTool,
  UploadCloud,
  BrainCircuit,
  History,
  TrendingUp,
  FolderPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const quickActions = [
    {
      id: 'annotate',
      title: 'Annotate Studio',
      subtitle: 'Interactive Canvas',
      icon: PenTool,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      action: () => navigate('/annotate'),
    },
    {
      id: 'upload',
      title: 'Upload Study',
      subtitle: 'DICOM / PNG / JPG',
      icon: UploadCloud,
      gradient: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
      action: () => setShowUploadModal(true),
    },
    {
      id: 'ai-review',
      title: 'AI Queue',
      subtitle: '19 Urgent Cases',
      icon: BrainCircuit,
      gradient: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
      action: () => navigate('/projects?filter=needs_review'),
    },
    {
      id: 'active-learning',
      title: 'Active ML Loop',
      subtitle: 'Model Iteration 4',
      icon: Sparkles,
      gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
      action: () => navigate('/active-learning'),
    },
    {
      id: 'history',
      title: 'Audit Logs',
      subtitle: 'HIPAA Traceability',
      icon: History,
      gradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
      action: () => navigate('/projects'),
    },
  ];

  const recentStudies = [
    {
      id: 'proj-1',
      title: 'ICU Portable Chest X-Rays',
      description: 'Acute respiratory distress syndrome & pleural fluid monitoring',
      totalImages: 48,
      verifiedCount: 38,
      aiConfidence: '88.4%',
      tag: 'Cardiomegaly',
      tagColor: '#ef4444',
      thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'proj-2',
      title: 'Pneumothorax Rapid Screen Cohort',
      description: 'Tension pneumothorax line segmentation and lung border trace',
      totalImages: 24,
      verifiedCount: 16,
      aiConfidence: '76.2%',
      tag: 'Pneumothorax',
      tagColor: '#f59e0b',
      thumb: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'proj-3',
      title: 'Bilateral Infiltration & Pneumonia',
      description: 'Ground-glass opacity multi-region mask refinement',
      totalImages: 60,
      verifiedCount: 52,
      aiConfidence: '91.8%',
      tag: 'Infiltration',
      tagColor: '#8b5cf6',
      thumb: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'proj-4',
      title: 'Cardiomegaly Heart Silhouette Trial',
      description: 'Cardiothoracic ratio boundary measurement',
      totalImages: 35,
      verifiedCount: 35,
      aiConfidence: '94.1%',
      tag: 'Completed',
      tagColor: '#10b981',
      thumb: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* 1. Canva Hero Greeting Banner */}
      <div className="canva-hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#a78bfa', marginBottom: '8px' }}>
          <span>Clinical Radiology Workstation</span>
          <span>•</span>
          <span>Active Learning Pipeline Active</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Welcome to MEDORA, {user?.user_metadata?.full_name || 'Dr. Specialist'}{' '}
          <span className="hero-sparkle">✦</span>
        </h1>
        <p className="hero-subtitle">
          Accelerate your clinical workflow. Review AI-suggested lesion segmentations, edit masks
          with sub-pixel precision, and continuously improve diagnostic models through your verified corrections.
        </p>

        <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-gradient"
            onClick={() => navigate('/annotate')}
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            <PenTool size={16} />
            <span>Open Annotation Studio</span>
          </button>
          <button
            className="btn"
            onClick={() => navigate('/active-learning')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Sparkles size={16} color="#ec4899" />
            <span>Model Health & Retrain Loop</span>
          </button>
        </div>
      </div>

      {/* 2. Canva-Style Circular Quick Action Icons */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Quick Actions</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>1-click access to clinical workflows</span>
        </div>

        <div className="quick-actions-row">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="quick-action-card"
                onClick={action.action}
                title={action.subtitle}
              >
                <div
                  className="quick-action-icon-circle"
                  style={{ background: action.gradient }}
                >
                  <Icon size={26} strokeWidth={2.2} />
                </div>
                <div className="quick-action-label">{action.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-6px' }}>
                  {action.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Learning Pulse Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-700)',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Active Learning Cycle #4 Active
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Model Mean Dice Score increased from <strong style={{ color: 'var(--color-success)' }}>0.824 → 0.892</strong> following your last 32 corrected masks.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uncertainty Pool</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-700)' }}>19 Urgent Reviews</div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/active-learning')}
            style={{ fontSize: '13px' }}
          >
            <span>Inspect Retrain Metrics</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Recent Studies & Projects Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Active Cohorts & Studies</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Select a study to launch the Canva annotation studio
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/projects')}
            style={{ fontSize: '13px' }}
          >
            <span>View All Cohorts</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="projects-grid">
          {recentStudies.map((study) => {
            const progress = Math.round((study.verifiedCount / study.totalImages) * 100);
            return (
              <div
                key={study.id}
                className="project-card"
                onClick={() => navigate(`/project/${study.id}`)}
              >
                <div className="project-card-thumb">
                  <img src={study.thumb} alt={study.title} />
                  <span
                    className="card-badge"
                    style={{ borderLeft: `3px solid ${study.tagColor}` }}
                  >
                    {study.tag}
                  </span>
                </div>
                <div className="project-card-body">
                  <div className="project-card-title">{study.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {study.description}
                  </div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="project-card-meta">
                    <span>{study.verifiedCount} / {study.totalImages} Verified</span>
                    <span style={{ fontWeight: '700', color: 'var(--primary-600)' }}>
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simple Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Upload Chest Radiograph</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowUploadModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '36px 20px',
                  background: 'var(--bg-app)',
                  cursor: 'pointer',
                }}
              >
                <UploadCloud size={44} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '15px', fontWeight: '700' }}>Drag & Drop DICOM or PNG images</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports .dcm, .png, .jpg up to 50MB per file
                </div>
                <button className="btn btn-primary" style={{ marginTop: '16px' }}>
                  Browse Files
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-gradient"
                onClick={() => {
                  setShowUploadModal(false);
                  navigate('/annotate');
                }}
              >
                Upload & Annotate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
