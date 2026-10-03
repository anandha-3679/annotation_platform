import React, { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  Filter,
  Search,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  Brain,
  Layers,
} from 'lucide-react';

export default function ProjectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');

  const cohortName = id === 'proj-1'
    ? 'Chest PA — ICU Cohort'
    : id === 'proj-2'
    ? 'Cardiomegaly Pilot'
    : id === 'proj-3'
    ? 'Pneumothorax Urgents'
    : 'All Radiographic Studies';

  const sampleImages = [
    {
      id: 'img-101',
      accession: 'CXR-2026-9041',
      patientId: 'PT-89421',
      findings: 'Cardiomegaly, Mild Pleural Effusion',
      status: 'needs_review',
      statusLabel: 'Needs Review',
      statusColor: 'var(--color-warning)',
      confidence: 78,
      uncertainty: 'Medium Risk',
      thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
      date: 'Oct 02, 2026',
    },
    {
      id: 'img-102',
      accession: 'CXR-2026-9042',
      patientId: 'PT-89422',
      findings: 'Right Lower Lobe Pneumonia',
      status: 'active_learning',
      statusLabel: 'Active ML Queue',
      statusColor: 'var(--primary-600)',
      confidence: 64,
      uncertainty: 'High Uncertainty',
      thumb: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=400&q=80',
      date: 'Oct 02, 2026',
    },
    {
      id: 'img-103',
      accession: 'CXR-2026-9043',
      patientId: 'PT-89423',
      findings: 'Left Apical Pneumothorax',
      status: 'completed',
      statusLabel: 'Doctor Verified',
      statusColor: 'var(--color-success)',
      confidence: 94,
      uncertainty: 'Verified Mask',
      thumb: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
      date: 'Oct 01, 2026',
    },
    {
      id: 'img-104',
      accession: 'CXR-2026-9044',
      patientId: 'PT-89424',
      findings: 'Bilateral Infiltration & Atelectasis',
      status: 'needs_review',
      statusLabel: 'Needs Review',
      statusColor: 'var(--color-warning)',
      confidence: 72,
      uncertainty: 'Medium Risk',
      thumb: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
      date: 'Oct 01, 2026',
    },
    {
      id: 'img-105',
      accession: 'CXR-2026-9045',
      patientId: 'PT-89425',
      findings: 'Clear Lung Fields — Normal Baseline',
      status: 'completed',
      statusLabel: 'Doctor Verified',
      statusColor: 'var(--color-success)',
      confidence: 97,
      uncertainty: 'High Confidence',
      thumb: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80',
      date: 'Sep 30, 2026',
    },
  ];

  const filteredImages = sampleImages.filter((img) => {
    if (filter !== 'all' && img.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        img.accession.toLowerCase().includes(q) ||
        img.patientId.toLowerCase().includes(q) ||
        img.findings.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/dashboard')}
            style={{ padding: '4px 0', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <h1 style={{ fontSize: '26px', fontWeight: '800' }}>{cohortName}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Review AI segmentation masks, approve accurate detections, or open the Canva Studio to edit boundaries.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/active-learning')}
          >
            <Sparkles size={16} color="var(--primary-600)" />
            <span>Active Learning Queue (19)</span>
          </button>
          <button
            className="btn btn-gradient"
            onClick={() => navigate('/annotate')}
          >
            <Plus size={16} />
            <span>Launch Canvas Studio</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Studies' },
            { id: 'needs_review', label: 'Needs Doctor Review', icon: Clock },
            { id: 'active_learning', label: 'Active ML Queue', icon: Sparkles },
            { id: 'completed', label: 'Verified & Locked', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(tab.id)}
                style={{ fontSize: '13px', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
              >
                {Icon && <Icon size={14} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter by accession or finding..."
            className="form-input"
            style={{ padding: '6px 12px', fontSize: '13px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Image Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
        {filteredImages.map((img) => (
          <div
            key={img.id}
            className="project-card"
            style={{ cursor: 'default' }}
          >
            <div className="project-card-thumb">
              <img src={img.thumb} alt={img.accession} />
              <span
                className="card-badge"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderLeft: `3px solid ${img.statusColor}`,
                  color: '#ffffff',
                }}
              >
                {img.statusLabel}
              </span>
            </div>

            <div className="project-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>{img.accession}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{img.patientId}</span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {img.findings}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>AI Confidence Score</span>
                  <strong style={{ color: img.confidence > 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {img.confidence}%
                  </strong>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${img.confidence}%`,
                      background: img.confidence > 80 ? 'var(--color-success)' : 'var(--color-warning)',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{img.date}</span>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/annotate?imageId=${img.id}`)}
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                >
                  <span>Edit in Canvas</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
