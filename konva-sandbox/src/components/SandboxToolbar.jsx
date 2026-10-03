/**
 * SandboxToolbar — functional dev toolbar for Week 1 sandbox testing.
 * NOT the real app design — that comes in Week 3 when designs are shared.
 */

import { TOOLS } from '../constants';


const TOOL_LABELS = {
  [TOOLS.BRUSH]: '🖌 Brush',
  [TOOLS.ERASER]: '🧹 Eraser',
  [TOOLS.PAN]: '✋ Pan',
};

export function SandboxToolbar({
  tool, setTool,
  brushSize, setBrushSize,
  undo, redo,
  resetView, exportMask,
  canUndo, canRedo,
}) {
  return (
    <div className="sandbox-toolbar">
      {/* Tool selector */}
      <div className="toolbar-group">
        {Object.values(TOOLS).map((t) => (
          <button
            key={t}
            className={`tool-btn ${tool === t ? 'active' : ''}`}
            onClick={() => setTool(t)}
            title={TOOL_LABELS[t]}
          >
            {TOOL_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Brush size (shown for brush & eraser) */}
      {tool !== TOOLS.PAN && (
        <div className="toolbar-group">
          <label className="size-label">
            Size: <strong>{brushSize}px</strong>
          </label>
          <input
            type="range"
            min={2}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="size-slider"
          />
        </div>
      )}

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button className="tool-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          ↩ Undo
        </button>
        <button className="tool-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          ↪ Redo
        </button>
      </div>

      {/* View / Export */}
      <div className="toolbar-group">
        <button className="tool-btn" onClick={resetView} title="Reset zoom & pan">
          🔍 Reset
        </button>
        <button className="tool-btn export-btn" onClick={exportMask} title="Download mask PNG">
          ⬇ Export Mask
        </button>
      </div>

      <p className="toolbar-hint">
        Scroll to zoom · Pan mode to drag · Ctrl+Z/Y for undo/redo
      </p>
    </div>
  );
}
