import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BrainCircuit,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Cpu,
} from 'lucide-react';

export default function ActiveLearning() {
  const navigate = useNavigate();
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const iterations = [
    { version: 'v1.0 (Baseline)', date: 'Aug 15, 2026', images: 500, diceScore: 0.742, status: 'Superseded' },
    { version: 'v1.1 (Active Loop 1)', date: 'Sep 01, 2026', images: 620, diceScore: 0.789, status: 'Superseded' },
    { version: 'v2.0 (Active Loop 2)', date: 'Sep 18, 2026', images: 780, diceScore: 0.841, status: 'Superseded' },
    { version: 'v2.1 (Current Production)', date: 'Oct 01, 2026', images: 940, diceScore: 0.892, status: 'Active' },
  ];

  const pendingBatch = [
    {
      id: 'img-102',
      accession: 'CXR-2026-9042',
      finding: 'Right Lower Lobe Pneumonia',
      uncertainty: 'High (0.42 entropy)',
      confidence: '64%',
      radiologistStatus: 'Corrections Drawn',
    },
    {
      id: 'img-104',
      accession: 'CXR-2026-9044',
      finding: 'Bilateral Infiltration & Atelectasis',
      uncertainty: 'Medium (0.28 entropy)',
      confidence: '72%',
      radiologistStatus: 'Corrections Drawn',
    },
    {
      id: 'img-107',
      accession: 'CXR-2026-9049',
      finding: 'Suspected Basilar Effusion',
      uncertainty: 'High (0.39 entropy)',
      confidence: '68%',
      radiologistStatus: 'Pending Mask Fix',
    },
  ];

  const handleTriggerRetrain = () => {
    setRetraining(true);
    setTimeout(() => {
      setRetraining(false);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 5000);
    }, 2400);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary-600)', marginBottom: '4px' }}>
            <BrainCircuit size={16} />
            <span>Human-In-The-Loop AI Calibration</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Active Learning Feedback Pipeline</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '750px' }}>
            Every time you correct an AI-suggested segmentation mask in MEDORA, the delta is archived.
            The uncertainty sampling engine flags the most ambiguous radiographs for your attention,
            maximizing accuracy gains with minimal radiologist effort.
          </p>
        </div>

        <button
          className="btn btn-gradient"
          disabled={retraining}
          onClick={handleTriggerRetrain}
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          <RefreshCw size={16} className={retraining ? 'animate-spin' : ''} />
          <span>{retraining ? 'Queuing Training Workers...' : 'Export Batch to ML Model'}</span>
        </button>
      </div>

      {retrainSuccess && (
        <div
          style={{
            background: 'var(--color-success-bg)',
            border: '1px solid #a7f3d0',
            color: 'var(--color-success)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={20} />
          <span>
            Batch of 32 verified radiologist masks successfully packaged and transmitted to training pipeline (Iteration 5 queued).
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Current Mean Dice Score
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-700)', marginTop: '6px' }}>
            0.892
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={14} />
            <span>+15.0% accuracy increase since baseline</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Verified Corrected Masks
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '6px' }}>
            32 / 35
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            3 cases pending doctor review in active batch
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Model Architecture
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '10px' }}>
            U-Net + ResNet-50
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Weights: PyTorch checkpoint • `chest_xray_seg.pth`
          </div>
        </div>
      </div>

      {/* Uncertainty Sampling Queue */}
      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>High Uncertainty Sampling Queue</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Cases where the model had ambiguous borders or low confidence — correcting these provides the highest model learning rate
            </div>
          </div>
          <span className="panel-badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', padding: '4px 10px', fontSize: '12px' }}>
            3 Priority Cases
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 24px' }}>Accession #</th>
              <th style={{ padding: '12px 16px' }}>AI Predicted Finding</th>
              <th style={{ padding: '12px 16px' }}>Uncertainty Level</th>
              <th style={{ padding: '12px 16px' }}>Confidence</th>
              <th style={{ padding: '12px 16px' }}>Correction Status</th>
              <th style={{ padding: '12px 24px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingBatch.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '14px 24px', fontWeight: 600 }}>{item.accession}</td>
                <td style={{ padding: '14px 16px' }}>{item.finding}</td>
                <td style={{ padding: '14px 16px', color: 'var(--color-warning)', fontWeight: 600 }}>{item.uncertainty}</td>
                <td style={{ padding: '14px 16px' }}>{item.confidence}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      background: item.radiologistStatus.includes('Drawn') ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                      color: item.radiologistStatus.includes('Drawn') ? 'var(--color-success)' : 'var(--color-warning)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {item.radiologistStatus}
                  </span>
                </td>
                <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/annotate?imageId=${item.id}`)}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    <span>Inspect Mask</span>
                    <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Historical Iterations Progression */}
      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Active Learning Iteration Progression</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {iterations.map((it, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: it.status === 'Active' ? '2px solid var(--primary-500)' : '1px solid var(--border-light)',
                background: it.status === 'Active' ? 'var(--primary-50)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{it.version}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{it.date}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-700)', margin: '8px 0 4px' }}>
                {it.diceScore.toFixed(3)} Dice
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Trained on {it.images} verified radiographs
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
