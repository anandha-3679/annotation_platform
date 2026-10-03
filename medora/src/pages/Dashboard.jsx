import React, { useState, useEffect } from 'react';
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
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjects, uploadImage } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.warn('Could not load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setUploadError('Please select a target cohort.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Please select a chest X-ray file.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const result = await uploadImage(selectedProjectId, selectedFile);
      setShowUploadModal(false);
      setSelectedFile(null);
      await loadProjects();
      // Navigate directly into project studies
      navigate(`/project/${selectedProjectId}`);
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

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
      subtitle: 'Priority Cases',
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

  const totalStudies = projects.reduce((acc, p) => acc + (p.total_images || 0), 0);
  const totalAnnotated = projects.reduce((acc, p) => acc + (p.annotated_images || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Hero Greeting Banner */}
      <div className="hero-banner">
        <div className="hero-tag">
          <Sparkles size={14} />
          <span>Clinical Radiology Workstation</span>
          <span>•</span>
          <span>Active Learning Pipeline Active</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Welcome to MEDORA, {user?.user_metadata?.full_name || user?.name || 'Dr. Specialist'}{' '}
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
            className="btn btn-secondary"
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <UploadCloud size={16} />
            <span>Upload New Study</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/active-learning')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.15)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700' }}>Active Learning Cycle #4 Active</span>
              <span className="badge badge-success">Model Dice 0.892 (+15%)</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {totalAnnotated} of {totalStudies} radiographs reviewed by radiologists. Corrected segmentations directly improve next fine-tuning weights.
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/active-learning')}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          <span>View Uncertainty Queue</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4. Active Cohorts & Studies Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Clinical Cohorts & Datasets</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Managed imaging cohorts synchronized with PostgreSQL & Supabase Storage
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/projects')}
            style={{ fontSize: '13px' }}
          >
            <span>View All ({projects.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-light)' }}>
            <FolderPlus size={40} color="var(--primary-400)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>No cohorts found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Create your first clinical cohort to begin uploading X-rays.</p>
          </div>
        ) : (
          <div className="card-grid">
            {projects.map((proj) => {
              const total = proj.total_images || 0;
              const annotated = proj.annotated_images || 0;
              const progress = total > 0 ? Math.round((annotated / total) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  className="study-card"
                  onClick={() => navigate(`/project/${proj.id}`)}
                >
                  <div className="study-card-thumb">
                    <img
                      src="/sample-xray.png"
                      alt={proj.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="study-card-tag" style={{ background: '#7c3aed' }}>
                      {proj.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="study-card-body">
                    <div className="study-card-title">{proj.name}</div>
                    <div className="study-card-desc">{proj.description || 'Clinical cohort for radiologist mask review'}</div>

                    <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                        }}
                      >
                        <span>Verified: {annotated} / {total}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="study-progress-bar">
                        <div
                          className="study-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="study-card-footer">
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {total} Studies
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-600)' }}>
                        Open Cohort →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Study Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Upload Chest Radiograph</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {uploadError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'var(--color-danger-bg)',
                      color: 'var(--color-danger)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                    }}
                  >
                    {uploadError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Target Cohort</label>
                  <select
                    className="form-input"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.total_images || 0} studies)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Radiograph File (DICOM, PNG, JPEG)</label>
                  <div
                    style={{
                      border: '2px dashed var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '24px 20px',
                      background: 'var(--bg-app)',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('dashboard-file-input')?.click()}
                  >
                    <UploadCloud size={36} color="var(--primary-600)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>
                      {selectedFile ? selectedFile.name : 'Click to select chest X-ray'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Supports PNG, JPG, DCM up to 50MB'}
                    </div>
                    <input
                      id="dashboard-file-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,.dcm"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                          setUploadError('');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn btn-gradient"
                >
                  {uploading ? 'Uploading to Storage...' : 'Upload & View Studies'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
