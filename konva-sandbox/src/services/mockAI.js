/**
 * mockAI.js — Simulates Person 3's PyTorch model response.
 *
 * Real shape this will eventually return (Week 5):
 *   POST /predict → { maskUrl, confidence, uncertainty, findings, modelVersion }
 *
 * For now: generates a fake mask canvas + hardcoded findings.
 * The mask is rendered as a blue semi-transparent overlay so it's visually
 * distinct from the radiologist's red corrections layer.
 */

// ── Fake segmentation mask generator ─────────────────────────────────────────
function buildMockMaskDataUrl(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // -- Left lung region (AI thinks this is normal tissue)
  ctx.fillStyle = 'rgba(40, 160, 255, 0.30)';
  ctx.beginPath();
  ctx.ellipse(
    width * 0.31, height * 0.47,
    width * 0.12, height * 0.23,
    -0.08, 0, Math.PI * 2
  );
  ctx.fill();

  // -- Right lung region (AI thinks this is normal tissue)
  ctx.fillStyle = 'rgba(40, 160, 255, 0.30)';
  ctx.beginPath();
  ctx.ellipse(
    width * 0.63, height * 0.46,
    width * 0.13, height * 0.24,
    0.08, 0, Math.PI * 2
  );
  ctx.fill();

  // -- Finding 1: Pulmonary opacity — lower right lobe (higher confidence → brighter)
  ctx.fillStyle = 'rgba(40, 160, 255, 0.70)';
  ctx.beginPath();
  ctx.ellipse(
    width * 0.68, height * 0.65,
    width * 0.07, height * 0.09,
    0.25, 0, Math.PI * 2
  );
  ctx.fill();

  // -- Finding 2: Pleural effusion — right base (moderate confidence)
  ctx.fillStyle = 'rgba(40, 160, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(
    width * 0.70, height * 0.75,
    width * 0.09, height * 0.06,
    0.1, 0, Math.PI * 2
  );
  ctx.fill();

  return canvas.toDataURL();
}

// ── Structured findings (mirrors what the real model + NLP layer would return) ─
const MOCK_FINDINGS = [
  {
    id: 'f1',
    label: 'Pulmonary Opacity',
    location: 'Lower right lobe',
    severity: 'Mild',
    confidence: 0.81,
  },
  {
    id: 'f2',
    label: 'Pleural Effusion',
    location: 'Right hemithorax (base)',
    severity: 'Moderate',
    confidence: 0.67,
  },
];

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * getMockAIPrediction(stageWidth, stageHeight)
 *
 * Simulates a ~1.3s model inference call.
 * Returns the same shape that the real FastAPI /predict endpoint will return.
 */
export async function getMockAIPrediction(stageWidth, stageHeight) {
  // Simulate network + inference latency
  await new Promise((resolve) => setTimeout(resolve, 1300));

  return {
    maskDataUrl: buildMockMaskDataUrl(stageWidth, stageHeight),
    confidence: 0.73,       // overall mask confidence (0–1)
    uncertainty: 0.27,      // 1 – confidence; used for Smart Review queue
    modelVersion: 'mock-v0.1',
    findings: structuredClone(MOCK_FINDINGS),
  };
}
