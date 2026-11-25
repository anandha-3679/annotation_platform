/**
 * Client-side image preprocessing for chest X-ray uploads.
 *
 * Matches the ML model's training preprocessing:
 *  1. Convert to 2D grayscale luminance
 *  2. Robust intensity normalization (1st-99th percentile clipping + min-max scaling)
 *  3. Resize to 256x256 using bilinear/high-quality canvas resampling
 *
 * DICOM files (.dcm / .dicom) are passed through unchanged so the backend
 * can extract DICOM pixel data and modality rescale/photometric metadata.
 */

const TARGET_SIZE = 256;

function isDicomFile(file) {
  const name = (file?.name || '').toLowerCase();
  return name.endsWith('.dcm') || name.endsWith('.dicom');
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function percentileFromSorted(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Preprocesses a standard image file (PNG/JPG/WebP) to a 256x256 normalized
 * grayscale PNG File. Returns DICOM files unchanged.
 */
export async function preprocessImageForUpload(file) {
  if (!file || isDicomFile(file)) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return file;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let bitmap = null;
  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file);
      ctx.drawImage(bitmap, 0, 0, TARGET_SIZE, TARGET_SIZE);
    } else {
      const img = await loadImageElement(file);
      ctx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE);
    }
  } finally {
    if (bitmap && typeof bitmap.close === 'function') {
      bitmap.close();
    }
  }

  const imageData = ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
  const data = imageData.data;
  const pixelCount = TARGET_SIZE * TARGET_SIZE;
  const gray = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    gray[i] =
      0.299 * data[offset] +
      0.587 * data[offset + 1] +
      0.114 * data[offset + 2];
  }

  // Robust intensity normalization: 1st-99th percentile clipping
  const sorted = Float32Array.from(gray).sort();
  const lower = percentileFromSorted(sorted, 1);
  const upper = percentileFromSorted(sorted, 99);

  if (upper > lower) {
    const range = upper - lower;
    for (let i = 0; i < pixelCount; i++) {
      const clipped = Math.min(upper, Math.max(lower, gray[i]));
      const norm = Math.round(((clipped - lower) / range) * 255);
      const offset = i * 4;
      data[offset] = norm;
      data[offset + 1] = norm;
      data[offset + 2] = norm;
      data[offset + 3] = 255;
    }
  } else {
    for (let i = 0; i < pixelCount; i++) {
      const val = Math.round(gray[i]);
      const offset = i * 4;
      data[offset] = val;
      data[offset + 1] = val;
      data[offset + 2] = val;
      data[offset + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) {
    return file;
  }

  const baseName = (file.name || 'xray').replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.png`, { type: 'image/png' });
}
