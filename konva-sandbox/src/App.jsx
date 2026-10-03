/**
 * Week 2 Sandbox — AI overlay + findings panel wired to AnnotationCanvas.
 *
 * State machine:
 *   loading → predicted → editing | accepted
 */

import { useState, useEffect } from 'react';
import { AnnotationCanvas } from './components/AnnotationCanvas';
import { TOOLS } from './constants';
import { SandboxToolbar } from './components/SandboxToolbar';
import { AIPanel } from './components/AIPanel';
import { getMockAIPrediction } from './services/mockAI';
import sampleXray from './assets/sample-xray.png';

const STAGE_SIZE = 600;

export default function App() {
  // ── Canvas tool state ────────────────────────────────────────────────────
  const [tool, setTool] = useState(TOOLS.BRUSH);
  const [brushSize, setBrushSize] = useState(18);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canvasControls, setCanvasControls] = useState(null);

  // ── AI state ─────────────────────────────────────────────────────────────
  const [aiStatus, setAiStatus] = useState('loading'); // loading | predicted | editing | accepted
  const [aiResponse, setAiResponse] = useState(null);
  const [showAIMask, setShowAIMask] = useState(true);

  // ── Findings state (user-editable copy of AI findings) ───────────────────
  const [findings, setFindings] = useState([]);

  // ── Fetch mock AI prediction on mount ────────────────────────────────────
  useEffect(() => {
    getMockAIPrediction(STAGE_SIZE, STAGE_SIZE).then((response) => {
      setAiResponse(response);
      setFindings(response.findings);
      setAiStatus('predicted');
    });
  }, []);

  // ── AI Panel handlers ─────────────────────────────────────────────────────
  const handleAccept = () => {
    setAiStatus('accepted');
    // In real app: POST /annotations with { source: 'ai_accepted', maskUrl: aiResponse.maskDataUrl, findings }
    console.log('[Accept] Saving AI mask as annotation', { findings });
  };

  const handleEdit = () => {
    setAiStatus('editing');
    setTool(TOOLS.BRUSH); // switch to brush so user can start correcting
  };

  return (
    <div className="sandbox-root">
      <header className="sandbox-header">
        <h1>ChestAnnotate · Konva Sandbox</h1>
        <p className="sandbox-subtitle">
          Week 2 · AI overlay + findings panel
          {aiStatus === 'loading' && ' — Analyzing…'}
          {aiStatus === 'predicted' && ' — Review AI prediction'}
          {aiStatus === 'editing' && ' — Editing corrections'}
          {aiStatus === 'accepted' && ' — Accepted ✓'}
        </p>
      </header>

      <div className="sandbox-layout">
        {/* ── Canvas ── */}
        <div className="canvas-col">
          {/* Layer legend */}
          <div className="layer-legend">
            <span className="legend-item legend-ai">● AI mask</span>
            <span className="legend-item legend-user">● Your edits</span>
          </div>

          <div className="canvas-wrapper">
            <AnnotationCanvas
              imageUrl={sampleXray}
              stageWidth={STAGE_SIZE}
              stageHeight={STAGE_SIZE}
              tool={tool}
              brushSize={brushSize}
              aiMaskUrl={aiResponse?.maskDataUrl ?? null}
              showAIMask={showAIMask}
              onUndoStackChange={setCanUndo}
              onRedoStackChange={setCanRedo}
              onControlsReady={setCanvasControls}
              onSave={(dataUrl) => console.log('Mask exported:', dataUrl.slice(0, 60))}
            />
          </div>

          {/* Toolbar below canvas */}
          <SandboxToolbar
            tool={tool}
            setTool={setTool}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            undo={canvasControls?.undo ?? (() => {})}
            redo={canvasControls?.redo ?? (() => {})}
            resetView={canvasControls?.resetView ?? (() => {})}
            exportMask={canvasControls?.exportMask ?? (() => {})}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>

        {/* ── AI Panel ── */}
        <div className="ai-col">
          <AIPanel
            status={aiStatus}
            confidence={aiResponse?.confidence ?? 0}
            uncertainty={aiResponse?.uncertainty ?? 0}
            modelVersion={aiResponse?.modelVersion}
            findings={findings}
            onFindingsChange={setFindings}
            onAccept={handleAccept}
            onEdit={handleEdit}
            showAIMask={showAIMask}
            onToggleAIMask={() => setShowAIMask((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}