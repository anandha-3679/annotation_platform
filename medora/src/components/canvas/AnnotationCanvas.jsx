import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line } from 'react-konva';
import useImage from 'use-image';
import { TOOLS } from './constants';

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_FACTOR = 1.08;

function getRelativePointerPosition(stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return transform.point(pos);
}

export function AnnotationCanvas({
  imageUrl,
  initialMask = [],
  tool = TOOLS.BRUSH,
  brushSize = 16,
  brushColor = 'rgba(239, 68, 68, 0.75)', // Default vibrant coral red
  aiMaskUrl = null,
  showAIMask = true,
  aiMaskOpacity = 0.7,
  onUndoStackChange,
  onRedoStackChange,
  onControlsReady,
  onSave,
  stageWidth = 650,
  stageHeight = 650,
}) {
  const [image] = useImage(imageUrl);
  const [aiMaskImage] = useImage(aiMaskUrl);

  const onControlsReadyRef = useRef(onControlsReady);
  useEffect(() => {
    onControlsReadyRef.current = onControlsReady;
  }, [onControlsReady]);

  // Drawing state
  const [lines, setLines] = useState(initialMask);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    onUndoStackChange?.(undoStack.length > 0);
  }, [undoStack, onUndoStackChange]);

  useEffect(() => {
    onRedoStackChange?.(redoStack.length > 0);
  }, [redoStack, onRedoStackChange]);

  // Zoom / Pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const maskLayerRef = useRef(null);

  // Drawing handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (tool === TOOLS.PAN) return;
      isDrawing.current = true;

      const snapshot = linesRef.current;
      setUndoStack((prev) => [...prev, snapshot]);
      setRedoStack([]);

      const stage = e.target.getStage();
      const point = getRelativePointerPosition(stage);

      const newLine = {
        id: `line-${Date.now()}`,
        points: [point.x, point.y, point.x + 0.01, point.y + 0.01],
        strokeWidth: brushSize,
        tool,
        globalCompositeOperation:
          tool === TOOLS.ERASER ? 'destination-out' : 'source-over',
        color: tool === TOOLS.ERASER ? 'rgba(0,0,0,1)' : brushColor,
      };

      setLines((prev) => [...prev, newLine]);
    },
    [tool, brushSize, brushColor]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing.current || tool === TOOLS.PAN) return;
      const stage = e.target.getStage();
      const point = getRelativePointerPosition(stage);

      setLines((prev) => {
        if (prev.length === 0) return prev;
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

  // Undo / Redo
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

  // Zoom / Pan
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

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, s * 1.25));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, s / 1.25));
  }, []);

  // Export
  const exportMask = useCallback(() => {
    const stage = stageRef.current;
    const maskLayer = maskLayerRef.current;
    if (!stage || !maskLayer) return;

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

    stage.scale({ x: currentScale, y: currentScale });
    stage.position(currentPos);
    stage.batchDraw();

    const a = document.createElement('a');
    a.download = `medora-mask-${Date.now()}.png`;
    a.href = dataUrl;
    a.click();

    onSave?.(dataUrl);
    return dataUrl;
  }, [stageWidth, stageHeight, onSave]);

  const controlsRef = useRef({});
  controlsRef.current = { undo, redo, resetView, zoomIn, zoomOut, exportMask };

  useEffect(() => {
    onControlsReadyRef.current?.({
      undo: (...args) => controlsRef.current.undo(...args),
      redo: (...args) => controlsRef.current.redo(...args),
      resetView: (...args) => controlsRef.current.resetView(...args),
      zoomIn: (...args) => controlsRef.current.zoomIn(...args),
      zoomOut: (...args) => controlsRef.current.zoomOut(...args),
      exportMask: (...args) => controlsRef.current.exportMask(...args),
    });
  }, []);

  // Keyboard shortcuts
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

  const cursorStyle =
    tool === TOOLS.PAN ? 'grab' : tool === TOOLS.ERASER ? 'cell' : 'crosshair';

  return (
    <div style={{ lineHeight: 0, cursor: cursorStyle, userSelect: 'none' }}>
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
        style={{ background: '#090d16', display: 'block', borderRadius: '4px' }}
      >
        {/* Layer 1 — Radiograph Image */}
        <Layer listening={false}>
          {image && (
            <KonvaImage
              image={image}
              width={stageWidth}
              height={stageHeight}
            />
          )}
        </Layer>

        {/* Layer 2 — AI predicted mask */}
        {aiMaskImage && showAIMask && (
          <Layer listening={false} opacity={aiMaskOpacity}>
            <KonvaImage
              image={aiMaskImage}
              width={stageWidth}
              height={stageHeight}
            />
          </Layer>
        )}

        {/* Layer 3 — Doctor Correction Layer */}
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
