import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  CheckCircle,
  Sparkles,
  Sliders,
  Layers as LayersIcon,
  Brain,
  History,
  Palette,
  Eye,
  EyeOff,
  Move,
  Eraser,
  PenTool,
  Save,
  Check,
  AlertCircle,
  X,
  Share2,
  Plus,
  Trash2,
} from 'lucide-react';
import { AnnotationCanvas } from '../components/canvas/AnnotationCanvas';
import { TOOLS, COLOR_PALETTES } from '../components/canvas/constants';
import { getMockAIPrediction } from '../services/mockAI';

// Default medical X-ray asset
const DEFAULT_XRAY = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=85';

export default function AnnotationWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const imageId = searchParams.get('imageId') || 'CXR-2026-9041';

  // Active Tool & Canvas State
  const [activeTool, setActiveTool] = useState(TOOLS.BRUSH);
  const [brushSize, setBrushSize] = useState(16);
  const [brushColor, setBrushColor] = useState(COLOR_PALETTES[0].value);
  const [activeDrawer, setActiveDrawer] = useState('tools'); // 'tools' | 'ai' | 'layers' | 'adjust' | null

  // AI Inference State
  const [aiLoading, setAiLoading] = useState(true);
  const [aiMaskUrl, setAiMaskUrl] = useState(null);
  const [aiConfidence, setAiConfidence] = useState(0.81);
  const [aiUncertainty, setAiUncertainty] = useState(0.19);
  const [showAIMask, setShowAIMask] = useState(true);
  const [aiMaskOpacity, setAiMaskOpacity] = useState(0.7);
  const [workflowStatus, setWorkflowStatus] = useState('predicted'); // 'predicted' | 'editing' | 'accepted'

  // Clinical Findings
  const [findings, setFindings] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState(
    'Bilateral lung expansion adequate. Irregular consolidation noted at right lower lobe. Blunting of costophrenic sulcus suggests mild fluid accumulation.'
  );

  // Undo/Redo & Canvas Controls
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const canvasControls = useRef(null);

  // Status message
  const [toastMsg, setToastMsg] = useState('AI Mask Generated ✦');

  // Load AI Prediction on Mount
  useEffect(() => {
    let mounted = true;
    setAiLoading(true);
    getMockAIPrediction(650, 650)
      .then((pred) => {
        if (!mounted) return;
        setAiMaskUrl(pred.maskDataUrl);
        setAiConfidence(pred.confidence);
        setAiUncertainty(pred.uncertainty);
        setFindings(pred.findings);
        setAiLoading(false);
        setToastMsg('AI Segmentation & Findings loaded ✦');
      })
      .catch(() => {
        if (mounted) setAiLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleControlsReady = (controls) => {
    canvasControls.current = controls;
  };

  const handleAcceptAI = () => {
    setWorkflowStatus('accepted');
    setToastMsg('AI Mask & Findings Approved! Saved to dataset ✦');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleStartEdit = () => {
    setWorkflowStatus('editing');
    setActiveTool(TOOLS.BRUSH);
    setActiveDrawer('tools');
    setToastMsg('Correction Mode: Draw corrections in canvas');
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleFeedActiveLearning = () => {
    setToastMsg('Transmitting corrected mask to PyTorch Active Learning Worker...');
    setTimeout(() => {
      setToastMsg('Success: Mask integrated into Model Retrain Batch #5 ✦');
      setTimeout(() => setToastMsg(''), 4000);
    }, 1500);
  };

  const handleAddFinding = () => {
    setFindings([
      ...findings,
      {
        id: `f-${Date.now()}`,
        label: 'New Finding',
        location: 'Right lung field',
        severity: 'Mild',
        confidence: 1.0,
      },
    ]);
  };

  const handleRemoveFinding = (id) => {
    setFindings(findings.filter((f) => f.id !== id));
  };

  const handleUpdateFinding = (id, key, val) => {
    setFindings(findings.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  return (
    <div className="editor-container">
      {/* ── TOP HEADER (CANVA STYLE) ── */}
      <header className="editor-header">
        <div className="editor-header-left">
          <button
            className="editor-back-btn"
            onClick={() => navigate('/dashboard')}
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Home</span>
          </button>

          <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />

          <div className="editor-title-box">
            <div className="editor-title">
              <span>Patient Study: {imageId}</span>
              <span
                className="editor-status-pill"
                style={{
                  background:
                    workflowStatus === 'accepted'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : workflowStatus === 'editing'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(124, 58, 237, 0.2)',
                  color:
                    workflowStatus === 'accepted'
                      ? '#34d399'
                      : workflowStatus === 'editing'
                      ? '#fbbf24'
                      : '#a78bfa',
                }}
              >
                {workflowStatus === 'accepted'
                  ? 'Doctor Approved'
                  : workflowStatus === 'editing'
                  ? 'Correction Mode'
                  : 'AI Suggestion'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              DICOM PA Erect • Apex Medical Center • {toastMsg || 'Auto-saved to Supabase ✦'}
            </div>
          </div>
        </div>

        {/* Center: Undo/Redo & Status */}
        <div className="editor-header-center">
          <button
            className="btn btn-ghost btn-icon"
            disabled={!canUndo}
            onClick={() => canvasControls.current?.undo()}
            title="Undo (Ctrl+Z)"
            style={{ color: canUndo ? '#ffffff' : '#64748b' }}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            disabled={!canRedo}
            onClick={() => canvasControls.current?.redo()}
            title="Redo (Ctrl+Y)"
            style={{ color: canRedo ? '#ffffff' : '#64748b' }}
          >
            <Redo2 size={18} />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="editor-header-right">
          {workflowStatus !== 'accepted' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleStartEdit}
                style={{
                  fontSize: '13px',
                  padding: '6px 14px',
                  background: workflowStatus === 'editing' ? 'var(--primary-600)' : 'transparent',
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <PenTool size={14} />
                <span>{workflowStatus === 'editing' ? 'Editing Active' : 'Edit Mask'}</span>
              </button>

              <button
                className="btn btn-success"
                onClick={handleAcceptAI}
                style={{ fontSize: '13px', padding: '6px 14px' }}
              >
                <Check size={16} />
                <span>Accept Mask</span>
              </button>
            </>
          )}

          {workflowStatus === 'accepted' && (
            <button
              className="btn btn-gradient"
              onClick={handleFeedActiveLearning}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              <Sparkles size={14} />
              <span>Feed into Active ML</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => canvasControls.current?.exportMask()}
            style={{ fontSize: '13px', padding: '6px 12px', background: 'transparent', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            title="Export segmentation mask as PNG"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* ── WORKSPACE (LEFT RAIL + DRAWER + CANVAS + RIGHT INSPECTOR) ── */}
      <div className="editor-workspace">
        {/* 1. Left Tool Rail (56px Canva Style) */}
        <aside className="editor-tool-rail">
          <button
            className={`editor-rail-btn ${activeDrawer === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveDrawer(activeDrawer === 'tools' ? null : 'tools')}
            title="Draw & Erase Tools"
          >
            <PenTool size={18} />
            <span>Tools</span>
          </button>

          <button
            className={`editor-rail-btn ${activeDrawer === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveDrawer(activeDrawer === 'ai' ? null : 'ai')}
            title="AI Model & Sensitivity"
          >
            <Brain size={18} />
            <span>AI Model</span>
          </button>

          <button
            className={`editor-rail-btn ${activeDrawer === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveDrawer(activeDrawer === 'layers' ? null : 'layers')}
            title="Layers & Masks"
          >
            <LayersIcon size={18} />
            <span>Layers</span>
          </button>

          <button
            className={`editor-rail-btn ${activeDrawer === 'adjust' ? 'active' : ''}`}
            onClick={() => setActiveDrawer(activeDrawer === 'adjust' ? null : 'adjust')}
            title="Radiological Adjustments"
          >
            <Sliders size={18} />
            <span>Adjust</span>
          </button>
        </aside>

        {/* 2. Expandable Drawer (280px Canva Style) */}
        {activeDrawer && (
          <aside className="editor-drawer">
            <div className="drawer-header">
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                {activeDrawer === 'tools' && 'Annotation Tools'}
                {activeDrawer === 'ai' && 'AI Model Inspector'}
                {activeDrawer === 'layers' && 'Layer Manager'}
                {activeDrawer === 'adjust' && 'Radiographic Adjustments'}
              </span>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setActiveDrawer(null)}
                style={{ width: '24px', height: '24px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div className="drawer-content">
              {/* Drawer Content: TOOLS */}
              {activeDrawer === 'tools' && (
                <>
                  <div>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Active Mode</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <button
                        className={`btn ${activeTool === TOOLS.BRUSH ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTool(TOOLS.BRUSH)}
                        style={{ padding: '8px 4px', fontSize: '12px' }}
                      >
                        <PenTool size={14} />
                        <span>Brush</span>
                      </button>
                      <button
                        className={`btn ${activeTool === TOOLS.ERASER ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTool(TOOLS.ERASER)}
                        style={{ padding: '8px 4px', fontSize: '12px' }}
                      >
                        <Eraser size={14} />
                        <span>Eraser</span>
                      </button>
                      <button
                        className={`btn ${activeTool === TOOLS.PAN ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTool(TOOLS.PAN)}
                        style={{ padding: '8px 4px', fontSize: '12px' }}
                      >
                        <Move size={14} />
                        <span>Pan</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <label className="form-label">Brush Width</label>
                      <span style={{ fontWeight: 700 }}>{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="60"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-600)' }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Pathology Palette</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {COLOR_PALETTES.map((pal) => (
                        <div
                          key={pal.value}
                          onClick={() => setBrushColor(pal.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: brushColor === pal.value ? '2px solid var(--primary-600)' : '1px solid var(--border-light)',
                            background: brushColor === pal.value ? 'var(--primary-50)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <span
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: pal.value,
                              display: 'inline-block',
                            }}
                          />
                          <span>{pal.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Drawer Content: AI MODEL */}
              {activeDrawer === 'ai' && (
                <>
                  <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-200)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-900)' }}>
                      U-Net ResNet-50 v2.1
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-700)', marginTop: '2px' }}>
                      Active Learning Calibration: 940 Training Studies
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span className="form-label">AI Mask Opacity</span>
                      <span>{Math.round(aiMaskOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={aiMaskOpacity}
                      onChange={(e) => setAiMaskOpacity(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-600)' }}
                    />
                  </div>

                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowAIMask(!showAIMask)}
                    style={{ fontSize: '12px', justifyContent: 'flex-start' }}
                  >
                    {showAIMask ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showAIMask ? 'Hide AI Mask Overlay' : 'Show AI Mask Overlay'}</span>
                  </button>
                </>
              )}

              {/* Drawer Content: LAYERS */}
              {activeDrawer === 'layers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Doctor Correction Layer</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 700 }}>Drawing</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>AI Predicted Mask</span>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setShowAIMask(!showAIMask)}
                      style={{ width: '24px', height: '24px' }}
                    >
                      {showAIMask ? <Eye size={14} /> : <EyeOff size={14} color="var(--text-muted)" />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Base Radiograph (DICOM)</span>
                    <Eye size={14} color="var(--text-muted)" />
                  </div>
                </div>
              )}

              {/* Drawer Content: ADJUSTMENTS */}
              {activeDrawer === 'adjust' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label" style={{ marginBottom: '6px' }}>Window Presets</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '11px' }}>Lung Window</button>
                      <button className="btn btn-secondary" style={{ fontSize: '11px' }}>Mediastinum</button>
                      <button className="btn btn-secondary" style={{ fontSize: '11px' }}>Bone Detail</button>
                      <button className="btn btn-secondary" style={{ fontSize: '11px' }}>Invert (Negative)</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* 3. Center Canvas Viewport */}
        <section className="canvas-viewport">
          {aiLoading ? (
            <div style={{ textAlign: 'center', color: '#ffffff' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--primary-500)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Running Neural Segmentation Model...</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Inference on PyTorch U-Net checkpoint</div>
            </div>
          ) : (
            <AnnotationCanvas
              imageUrl={DEFAULT_XRAY}
              tool={activeTool}
              brushSize={brushSize}
              brushColor={brushColor}
              aiMaskUrl={aiMaskUrl}
              showAIMask={showAIMask}
              aiMaskOpacity={aiMaskOpacity}
              onUndoStackChange={setCanUndo}
              onRedoStackChange={setCanRedo}
              onControlsReady={handleControlsReady}
              stageWidth={650}
              stageHeight={650}
            />
          )}

          {/* Canva Floating Bottom Pill Toolbar */}
          <div className="canvas-bottom-floating-pill">
            <button
              className="pill-tool-btn"
              onClick={() => canvasControls.current?.zoomOut()}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>

            <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '40px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>

            <button
              className="pill-tool-btn"
              onClick={() => canvasControls.current?.zoomIn()}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)' }} />

            <button
              className="pill-tool-btn"
              onClick={() => canvasControls.current?.resetView()}
              title="Fit to Frame"
            >
              <Maximize2 size={14} />
            </button>

            <button
              className={`pill-tool-btn ${activeTool === TOOLS.PAN ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === TOOLS.PAN ? TOOLS.BRUSH : TOOLS.PAN)}
              title="Toggle Pan Hand Tool"
            >
              <Move size={14} />
            </button>
          </div>
        </section>

        {/* 4. Right Inspector Panel (Canva Style: 330px) */}
        <aside className="editor-right-inspector">
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800 }}>Clinical Findings & AI</span>
              <span className="panel-badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                {Math.round(aiConfidence * 100)}% Confidence
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="progress-bar-container" style={{ marginTop: '10px', height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.round(aiConfidence * 100)}%`,
                  background: aiConfidence > 0.8 ? 'var(--color-success)' : 'var(--color-warning)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Low Uncertainty ({Math.round(aiUncertainty * 100)}%)</span>
              <span>Model v2.1</span>
            </div>
          </div>

          {/* Findings List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Detected Pathologies ({findings.length})
              </span>
              <button
                className="btn btn-ghost"
                onClick={handleAddFinding}
                style={{ fontSize: '11px', padding: '2px 8px', color: 'var(--primary-600)' }}
              >
                <Plus size={12} />
                <span>Add Custom</span>
              </button>
            </div>

            {findings.map((f) => (
              <div
                key={f.id}
                style={{
                  background: 'var(--bg-app)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={f.label}
                    onChange={(e) => handleUpdateFinding(f.id, 'label', e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      width: '85%',
                    }}
                  />
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleRemoveFinding(f.id)}
                    style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={f.location}
                    onChange={(e) => handleUpdateFinding(f.id, 'location', e.target.value)}
                    placeholder="Anatomical location"
                    className="form-input"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  />

                  <select
                    value={f.severity}
                    onChange={(e) => handleUpdateFinding(f.id, 'severity', e.target.value)}
                    className="form-input"
                    style={{ fontSize: '11px', padding: '4px 8px', width: '90px' }}
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>
            ))}

            {/* Doctor Clinical Impression Notes */}
            <div style={{ marginTop: '10px' }}>
              <label className="form-label" style={{ fontSize: '12px', marginBottom: '6px' }}>
                Radiologist Diagnostic Impression
              </label>
              <textarea
                rows={4}
                className="form-input"
                style={{ fontSize: '12px', resize: 'vertical' }}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter diagnostic report comments..."
              />
            </div>
          </div>

          {/* Inspector Footer Actions */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px', background: '#ffffff' }}>
            <button
              className="btn btn-primary"
              onClick={handleAcceptAI}
              style={{ width: '100%', padding: '10px' }}
            >
              <CheckCircle size={16} />
              <span>Verify & Lock Annotation</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleFeedActiveLearning}
              style={{ width: '100%', padding: '8px', fontSize: '12px' }}
            >
              <Sparkles size={14} color="var(--primary-600)" />
              <span>Submit to Retraining Queue</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
