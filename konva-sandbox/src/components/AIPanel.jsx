/**
 * AIPanel.jsx — Day 9 component.
 *
 * Shows the AI prediction results alongside the canvas:
 *   - Confidence meter
 *   - Accept / Edit action buttons
 *   - Findings list (AI-pre-filled, radiologist-editable)
 *
 * Props:
 *   status        : 'loading' | 'predicted' | 'editing' | 'accepted'
 *   confidence    : number (0–1)
 *   uncertainty   : number (0–1)
 *   modelVersion  : string
 *   findings      : Finding[]
 *   onFindingsChange : (findings: Finding[]) => void
 *   onAccept      : () => void
 *   onEdit        : () => void
 *   showAIMask    : boolean
 *   onToggleAIMask: () => void
 */

import { useState } from 'react';

// ── Severity options ──────────────────────────────────────────────────────────
const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe', 'Normal'];

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceMeter({ confidence, uncertainty }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80 ? '#4ade80' : pct >= 60 ? '#facc15' : '#f87171';

  return (
    <div className="confidence-block">
      <div className="confidence-row">
        <span className="conf-label">AI Confidence</span>
        <span className="conf-value" style={{ color }}>{pct}%</span>
      </div>
      <div className="conf-bar-track">
        <div
          className="conf-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="uncertainty-row">
        <span className="unc-label">Uncertainty</span>
        <span className="unc-value">{Math.round(uncertainty * 100)}%</span>
      </div>
    </div>
  );
}

function FindingCard({ finding, editable, onChange, onRemove }) {
  return (
    <div className="finding-card">
      <div className="finding-card-header">
        <div className="finding-conf-dot" title={`${Math.round(finding.confidence * 100)}% confidence`}>
          <span
            className="dot"
            style={{
              background:
                finding.confidence >= 0.75
                  ? '#4ade80'
                  : finding.confidence >= 0.55
                  ? '#facc15'
                  : '#f87171',
            }}
          />
          <span className="dot-label">{Math.round(finding.confidence * 100)}%</span>
        </div>
        {editable && (
          <button className="remove-btn" onClick={onRemove} title="Remove finding">
            ✕
          </button>
        )}
      </div>

      {editable ? (
        <div className="finding-fields">
          <input
            className="finding-input"
            value={finding.label}
            onChange={(e) => onChange({ ...finding, label: e.target.value })}
            placeholder="Finding label"
          />
          <input
            className="finding-input"
            value={finding.location}
            onChange={(e) => onChange({ ...finding, location: e.target.value })}
            placeholder="Location"
          />
          <select
            className="finding-select"
            value={finding.severity}
            onChange={(e) => onChange({ ...finding, severity: e.target.value })}
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="finding-display">
          <p className="finding-label-text">{finding.label}</p>
          <p className="finding-meta">
            {finding.location} · <span className={`sev-${finding.severity.toLowerCase()}`}>{finding.severity}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIPanel({
  status,
  confidence,
  uncertainty,
  modelVersion,
  findings,
  onFindingsChange,
  onAccept,
  onEdit,
  showAIMask,
  onToggleAIMask,
}) {
  const isEditing = status === 'editing';
  const isAccepted = status === 'accepted';
  const isLoading = status === 'loading';

  // Add a blank finding
  const addFinding = () => {
    onFindingsChange([
      ...findings,
      {
        id: `f-${Date.now()}`,
        label: '',
        location: '',
        severity: 'Mild',
        confidence: 1.0, // user-added = 100% human confidence
      },
    ]);
  };

  const updateFinding = (id, updated) => {
    onFindingsChange(findings.map((f) => (f.id === id ? updated : f)));
  };

  const removeFinding = (id) => {
    onFindingsChange(findings.filter((f) => f.id !== id));
  };

  return (
    <div className="ai-panel">
      {/* ── Header ── */}
      <div className="ai-panel-header">
        <div className="ai-header-left">
          <span className="ai-icon">🤖</span>
          <span className="ai-title">AI Analysis</span>
        </div>
        {modelVersion && (
          <span className="model-version">{modelVersion}</span>
        )}
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="ai-loading">
          <div className="spinner" />
          <p>Analyzing image…</p>
          <p className="loading-sub">Running segmentation model</p>
        </div>
      )}

      {/* ── Predicted / Editing / Accepted states ── */}
      {!isLoading && (
        <>
          {/* Confidence meter */}
          <ConfidenceMeter confidence={confidence} uncertainty={uncertainty} />

          {/* AI mask toggle */}
          <button
            className={`toggle-mask-btn ${showAIMask ? 'active' : ''}`}
            onClick={onToggleAIMask}
          >
            {showAIMask ? '👁 Hide AI Mask' : '👁 Show AI Mask'}
          </button>

          {/* Actions */}
          {!isAccepted && (
            <div className="ai-actions">
              <button
                className="btn-accept"
                onClick={onAccept}
                disabled={isEditing}
              >
                ✓ Accept
              </button>
              <button
                className={`btn-edit ${isEditing ? 'active' : ''}`}
                onClick={onEdit}
              >
                {isEditing ? '✏ Editing…' : '✏ Edit'}
              </button>
            </div>
          )}

          {isAccepted && (
            <div className="accepted-badge">
              ✅ AI prediction accepted
            </div>
          )}

          {isEditing && (
            <p className="edit-hint">
              Draw corrections in red on the canvas.<br />
              Edit findings below, then export when done.
            </p>
          )}

          {/* ── Findings section ── */}
          <div className="findings-section">
            <div className="findings-header">
              <span className="findings-title">Findings</span>
              <span className="findings-count">{findings.length}</span>
            </div>

            {findings.length === 0 && (
              <p className="no-findings">No findings — add one below.</p>
            )}

            <div className="findings-list">
              {findings.map((f) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  editable={isEditing || isAccepted}
                  onChange={(updated) => updateFinding(f.id, updated)}
                  onRemove={() => removeFinding(f.id)}
                />
              ))}
            </div>

            {(isEditing || isAccepted) && (
              <button className="add-finding-btn" onClick={addFinding}>
                + Add finding
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
