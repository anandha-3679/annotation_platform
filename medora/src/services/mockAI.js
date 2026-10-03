/**
 * mockAI.js — Simulates Person 3's PyTorch model response in MEDORA.
 *
 * Real shape returned by FastAPI /predict:
 *   POST /predict → { maskUrl, confidence, uncertainty, findings, modelVersion }
 */

function buildMockMaskDataUrl(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Left lung region (normal tissue baseline)
  ctx.fillStyle = 'rgba(124, 58, 237, 0.25)'; // Violet hue
  ctx.beginPath();
  ctx.ellipse(
    width * 0.31, height * 0.47,
    width * 0.12, height * 0.23,
    -0.08, 0, Math.PI * 2
  );
  ctx.fill();

  // Right lung region
  ctx.fillStyle = 'rgba(124, 58, 237, 0.25)';
  ctx.beginPath();
  ctx.ellipse(
    width * 0.63, height * 0.46,
    width * 0.13, height * 0.24,
    0.08, 0, Math.PI * 2
  );
  ctx.fill();

  // Finding 1: Pulmonary opacity / Consolidation — lower right lobe
  ctx.fillStyle = 'rgba(236, 72, 153, 0.65)'; // Magenta highlight
  ctx.beginPath();
  ctx.ellipse(
    width * 0.68, height * 0.65,
    width * 0.08, height * 0.10,
    0.25, 0, Math.PI * 2
  );
  ctx.fill();

  // Finding 2: Pleural effusion — right base
  ctx.fillStyle = 'rgba(59, 130, 246, 0.60)'; // Blue highlight
  ctx.beginPath();
  ctx.ellipse(
    width * 0.70, height * 0.76,
    width * 0.09, height * 0.07,
    0.1, 0, Math.PI * 2
  );
  ctx.fill();

  return canvas.toDataURL();
}

const MOCK_FINDINGS = [
  {
    id: 'f1',
    label: 'Pulmonary Opacity',
    location: 'Right lower lobe',
    severity: 'Moderate',
    confidence: 0.84,
  },
  {
    id: 'f2',
    label: 'Pleural Effusion (Blunted CP Angle)',
    location: 'Right hemithorax base',
    severity: 'Mild',
    confidence: 0.72,
  },
  {
    id: 'f3',
    label: 'Cardiomegaly (Borderline)',
    location: 'Cardiac silhouette',
    severity: 'Mild',
    confidence: 0.68,
  },
];

export async function getMockAIPrediction(stageWidth = 650, stageHeight = 650) {
  // Simulate network & GPU latency
  await new Promise((resolve) => setTimeout(resolve, 1100));

  return {
    maskDataUrl: buildMockMaskDataUrl(stageWidth, stageHeight),
    confidence: 0.81,
    uncertainty: 0.19,
    modelVersion: 'U-Net ResNet50 v2.1',
    findings: structuredClone(MOCK_FINDINGS),
  };
}
