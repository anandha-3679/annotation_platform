/**
 * AnnotationCanvas — reusable component (Week 1 canvas + Week 2 AI layer).
 *
 * Props:
 *   imageUrl            : string   — URL (or imported asset) for the X-ray image
 *   initialMask         : Line[]   — optional pre-loaded mask strokes
 *   tool                : 'brush' | 'eraser' | 'pan'  — controlled from parent
 *   brushSize           : number
 *   aiMaskUrl           : string | null  — dataURL of AI predicted mask (blue overlay)
 *   showAIMask          : boolean        — toggle AI mask layer visibility
 *   onUndoStackChange   : (canUndo: bool) => void
 *   onRedoStackChange   : (canRedo: bool) => void
 *   onControlsReady     : ({ undo, redo, resetView, exportMask }) => void
 *   onSave              : (dataUrl: string) => void
 *   stageWidth          : number
 *   stageHeight         : number
 *
 * Layers (bottom → top):
 *   1. Image layer    — the X-ray
 *   2. AI mask layer  — AI predicted mask (blue, semi-transparent) [NEW Week 2]
 *   3. User edit layer — radiologist's brush/eraser corrections (red)
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';

import { TOOLS } from '../constants';


const MASK_COLOR = 'rgba(220, 50, 50, 0.55)'; // semi-transparent red overlay
const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_FACTOR = 1.08;

// ── Helper ───────────────────────────────────────────────────────────────────
function getRelativePointerPosition(stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return transform.point(pos);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AnnotationCanvas({
  imageUrl,
  initialMask = [],
  tool = TOOLS.BRUSH,
  brushSize = 18,
  aiMaskUrl = null,
  showAIMask = true,
  onUndoStackChange,
  onRedoStackChange,
  onControlsReady,
  onSave,
  stageWidth = 680,
  stageHeight = 680,
}) {
  const [image] = useImage(imageUrl);
  const [aiMaskImage] = useImage(aiMaskUrl);

  // Keep a stable ref to onControlsReady so we don't re-run the controls effect when it changes
  const onControlsReadyRef = useRef(onControlsReady);
  useEffect(() => { onControlsReadyRef.current = onControlsReady; }, [onControlsReady]);

  // ── Drawing state ───────────────────────────────────────────────────────────
  const [lines, setLines] = useState(initialMask);
  const linesRef = useRef(lines); // ref so callbacks always see fresh value
  useEffect(() => { linesRef.current = lines; }, [lines]);

  // ── Undo / Redo stacks ──────────────────────────────────────────────────────
  // undoStack: array of `lines` snapshots taken BEFORE each stroke
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Notify parent of undo/redo availability
  useEffect(() => {
    onUndoStackChange?.(undoStack.length > 0);
  }, [undoStack, onUndoStackChange]);

  useEffect(() => {
    onRedoStackChange?.(redoStack.length > 0);
  }, [redoStack, onRedoStackChange]);

  // ── Zoom / Pan state ────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // ── Refs ────────────────────────────────────────────────────────────────────
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const maskLayerRef = useRef(null);

  // ── Drawing handlers ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e) => {
      if (tool === TOOLS.PAN) return;
      isDrawing.current = true;

      // Snapshot lines BEFORE this stroke (for undo)
      const snapshot = linesRef.current;
      setUndoStack((prev) => [...prev, snapshot]);
      setRedoStack([]);

      const stage = e.target.getStage();
      const point = getRelativePointerPosition(stage);

      const newLine = {
        id: `line-${Date.now()}`,
        points: [point.x, point.y, point.x + 0.01, point.y + 0.01], // tiny offset so Konva renders a dot
        strokeWidth: brushSize,
        tool,
        globalCompositeOperation:
          tool === TOOLS.ERASER ? 'destination-out' : 'source-over',
        color: MASK_COLOR,
      };

      setLines((prev) => [...prev, newLine]);
    },
    [tool, brushSize]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing.current || tool === TOOLS.PAN) return;
      const stage = e.target.getStage();
      const point = getRelativePointerPosition(stage);

      setLines((prev) => {
        const last = prev[prev.length - 1];
        const updated = { ...last, points: [...last.points, point.x, point.y] };
        return [...prev.slice(0, -1), updated];
      });
    },
    [tool]
  );

  const stopDrawing = useCallback(() => {
    isDrawing.current = false;
  }, []);

  // ── Undo / Redo ─────────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setRedoStack((r) => [linesRef.current, ...r]);
      setLines(snapshot);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      setUndoStack((u) => [...u, linesRef.current]);
      setLines(next);
      return rest;
    });
  }, []);

  // ── Zoom / Pan ──────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, oldScale * (direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR))
    );

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // ── Mask export ─────────────────────────────────────────────────────────────
  const exportMask = useCallback(() => {
    const stage = stageRef.current;
    const maskLayer = maskLayerRef.current;
    if (!stage || !maskLayer) return;

    // Temporarily reset transform to export at original resolution
    const currentScale = stage.scaleX();
    const currentPos = { x: stage.x(), y: stage.y() };

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();

    const dataUrl = maskLayer.toDataURL({
      width: stageWidth,
      height: stageHeight,
      pixelRatio: 1,
    });

    // Restore transform
    stage.scale({ x: currentScale, y: currentScale });
    stage.position(currentPos);
    stage.batchDraw();

    // Trigger download
    const a = document.createElement('a');
    a.download = 'mask.png';
    a.href = dataUrl;
    a.click();

    onSave?.(dataUrl);
  }, [stageWidth, stageHeight, onSave]);

  // ── Expose controls to parent (only once, via stable ref) ──────────────────
  // We store controls in a ref object so the parent always gets the latest
  // function pointers without triggering infinite re-renders.
  const controlsRef = useRef({});
  controlsRef.current = { undo, redo, resetView, exportMask };

  useEffect(() => {
    // Called once on mount — passes a stable proxy so parent never re-renders
    onControlsReadyRef.current?.({
      undo:        (...args) => controlsRef.current.undo(...args),
      redo:        (...args) => controlsRef.current.redo(...args),
      resetView:   (...args) => controlsRef.current.resetView(...args),
      exportMask:  (...args) => controlsRef.current.exportMask(...args),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only once on mount

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.shiftKey && e.key === 'z'))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ── Cursor style ─────────────────────────────────────────────────────────────
  const cursorStyle =
    tool === TOOLS.PAN ? 'grab' : tool === TOOLS.ERASER ? 'cell' : 'crosshair';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ lineHeight: 0, cursor: cursorStyle }}>
      <Stage
        ref={stageRef}
        width={stageWidth}
        height={stageHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={tool === TOOLS.PAN}
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={stopDrawing}
        onWheel={handleWheel}
        style={{ background: '#0d0d0d', display: 'block' }}
      >
        {/* Layer 1 — X-ray image */}
        <Layer listening={false}>
          {image && (
            <KonvaImage
              image={image}
              width={stageWidth}
              height={stageHeight}
            />
          )}
        </Layer>

        {/* Layer 2 — AI mask overlay (blue, semi-transparent) */}
        {aiMaskImage && showAIMask && (
          <Layer listening={false} opacity={1}>
            <KonvaImage
              image={aiMaskImage}
              width={stageWidth}
              height={stageHeight}
            />
          </Layer>
        )}

        {/* Layer 3 — User edit mask (red brush/eraser corrections) */}
        <Layer ref={maskLayerRef}>
          {lines.map((line) => (
            <Line
              key={line.id}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.4}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={line.globalCompositeOperation}
              listening={false}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
