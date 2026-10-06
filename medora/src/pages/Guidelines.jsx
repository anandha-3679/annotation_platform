import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileCheck,
  AlertTriangle,
  PenTool,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function Guidelines() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '1. Clinical Annotation Standards', icon: BookOpen },
    { id: 'pathologies', title: '2. Chest Pathologies Guide', icon: FileCheck },
    { id: 'active-learning', title: '3. Human-in-the-Loop Feedback', icon: Brain },
    { id: 'canvas-controls', title: '4. Canvas & Tool Shortcuts', icon: PenTool },
    { id: 'hipaa', title: '5. HIPAA & Compliance Traceability', icon: ShieldCheck },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-600)', marginBottom: '4px' }}>
          <BookOpen size={16} />
          <span>Radiology Protocol & Quality Standards</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Clinical Guidelines & Annotation Manual</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '850px' }}>
          Standardized criteria for segmenting chest radiographs (CXR), interpreting AI suggestions,
          and calibrating active learning feedback loops in MEDORA.
        </p>
      </div>

      {/* Main Layout: Table of Contents + Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'flex-start' }}>
        {/* Navigation Sidebar */}
        <aside style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', padding: '16px', position: 'sticky', top: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>
            Table of Contents
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive ? 'var(--primary-50)' : 'transparent',
                    color: isActive ? 'var(--primary-700)' : 'var(--text-primary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isActive ? 'var(--primary-600)' : 'var(--text-muted)'} />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/annotate')}
              style={{ width: '100%', fontSize: '12px', justifyContent: 'center' }}
            >
              <PenTool size={14} />
              <span>Launch Studio</span>
            </button>
          </div>
        </aside>

        {/* Content Body */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Overview */}
          {activeSection === 'overview' && (
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>1. Clinical Annotation Standards</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                MEDORA utilizes pixel-level semantic segmentation for chest radiographs. High-quality annotations are essential
                for training reliable computer vision models. Radiologists must adhere to the following principles:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: 'var(--primary-900)' }}>
                    Marginal Accuracy
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Trace anatomical borders closely. When consolidations blur across parenchymal tissue, encompass the visible ground-glass opacities while avoiding cardiac and osseous borders.
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px', color: 'var(--primary-900)' }}>
                    Window / Level Assessment
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Standard chest window level (W: 1500, L: -600) should be referenced. Ensure subtle blunting in the costophrenic sulcus is differentiated from diaphragmatic contours.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Pathologies */}
          {activeSection === 'pathologies' && (
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>2. Standard Chest Pathologies Guide</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                Standard pathology color palettes configured in MEDORA:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Consolidation & Airspace Disease (#7C3AED)</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Dense opacification obscuring underlying pulmonary vessels. When air bronchograms are identified, include the whole consolidated lobar zone.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Pleural Effusion (#3B82F6)</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Fluid accumulation layering at the lung bases or fissures. Trace the meniscus sign and include the blunted costophrenic angle.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: '3px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Pneumothorax (#EF4444)</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Visceral pleural line with peripheral absence of vascular lung markings. Trace the pleural margin with precision brush mode.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Active Learning */}
          {activeSection === 'active-learning' && (
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>3. Human-in-the-Loop Active Learning Workflow</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                MEDORA optimizes your annotation time through **Uncertainty Sampling**:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '14px 18px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-600)', minWidth: '24px' }}>01</span>
                  <div style={{ fontSize: '13px' }}>
                    <strong>AI Pre-Inference:</strong> Unreviewed radiographs automatically receive predicted segmentation masks with uncertainty scores.
                  </div>
                </div>

                <div style={{ padding: '14px 18px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-600)', minWidth: '24px' }}>02</span>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Accept vs Edit:</strong> If the model outline is accurate, click <em>Accept Mask</em>. If errors exist, click <em>Edit Mask</em> to refine using brush/eraser.
                  </div>
                </div>

                <div style={{ padding: '14px 18px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-600)', minWidth: '24px' }}>03</span>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Closed Loop Retraining:</strong> The deltas between the AI suggestion and your verified mask are archived and queued for next model iteration weights.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Canvas & Shortcuts */}
          {activeSection === 'canvas-controls' && (
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>4. Canvas Navigation & Keyboard Shortcuts</h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 14px' }}>Shortcut / Action</th>
                      <th style={{ padding: '10px 14px' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>B</td>
                      <td style={{ padding: '10px 14px' }}>Switch to Brush Tool</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>E</td>
                      <td style={{ padding: '10px 14px' }}>Switch to Eraser Tool</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>Ctrl + Z</td>
                      <td style={{ padding: '10px 14px' }}>Undo stroke</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>Ctrl + Y</td>
                      <td style={{ padding: '10px 14px' }}>Redo stroke</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>Scroll Wheel</td>
                      <td style={{ padding: '10px 14px' }}>Zoom in / out on pointer location</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700 }}>Space + Drag</td>
                      <td style={{ padding: '10px 14px' }}>Pan image across canvas viewport</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 5: HIPAA & Security */}
          {activeSection === 'hipaa' && (
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>5. HIPAA & Compliance Traceability</h2>
              <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                MEDORA adheres to healthcare data protection requirements:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '14px 16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>De-identification:</strong> Direct patient identifiers (MRN, Name, DOB) must be de-identified prior to uploading to clinical cohorts.
                </div>
                <div style={{ padding: '14px 16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Immutable Audit Logging:</strong> Every mask creation, modification, and doctor approval event is logged in PostgreSQL with user ID and timestamp snapshots.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
