/**
 * services/api.js — Frontend HTTP client connecting MEDORA to the FastAPI backend.
 * Automatically attaches the JWT Bearer token from localStorage.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getAuthHeaders(isJson = true) {
  const token = localStorage.getItem('medora_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${clean}`;
}

// ── Projects / Cohorts ────────────────────────────────────────────────────────
export async function getProjects() {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch projects');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function getProject(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch project details');
  }
  return await res.json();
}

export async function createProject(payload) {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create project');
  }
  return await res.json();
}

export async function deleteProject(projectId) {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return true;
}

// ── Images ────────────────────────────────────────────────────────────────────
export async function getProjectImages(projectId) {
  const res = await fetch(`${API_BASE}/images/${projectId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch project radiographs');
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((img) => ({
    ...img,
    url: resolveMediaUrl(img.url),
  }));
}

export async function getImageDetail(imageId) {
  const res = await fetch(`${API_BASE}/images/detail/${imageId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch image detail');
  const img = await res.json();
  return {
    ...img,
    url: resolveMediaUrl(img.url),
  };
}

export async function uploadImage(projectId, file) {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/images/upload`, {
    method: 'POST',
    headers: getAuthHeaders(false), // No Content-Type so browser sets boundary
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to upload image');
  }
  const img = await res.json();
  return {
    ...img,
    url: resolveMediaUrl(img.url),
  };
}

// ── Annotations ───────────────────────────────────────────────────────────────
export async function getAnnotation(imageId) {
  const res = await fetch(`${API_BASE}/annotations/${imageId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch annotation');
  const ann = await res.json();
  if (!ann) return null;
  return {
    ...ann,
    mask_url: ann.mask_url ? resolveMediaUrl(ann.mask_url) : null,
  };
}

export async function saveAnnotation(payload) {
  const res = await fetch(`${API_BASE}/annotations`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save annotation');
  }
  const ann = await res.json();
  return {
    ...ann,
    mask_url: ann.mask_url ? resolveMediaUrl(ann.mask_url) : null,
  };
}

// ── Deep Learning AI Predictions & Warm-up ────────────────────────────────────
export async function predictImage(imageId, forceRecompute = false) {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      image_id: imageId,
      force_recompute: forceRecompute,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Deep Learning AI prediction failed');
  }
  const pred = await res.json();
  return {
    ...pred,
    mask_url: pred.mask_url ? resolveMediaUrl(pred.mask_url) : null,
    findings: (pred.findings || []).map((f) => ({
      ...f,
      mask_url: f.mask_url ? resolveMediaUrl(f.mask_url) : null,
    })),
  };
}

export async function warmupAI() {
  try {
    const res = await fetch(`${API_BASE}/predict/warmup`, {
      method: 'POST',
      headers: getAuthHeaders(true),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('DL warmup request failed:', err);
  }
  return { dl_service_up: false };
}

export async function getModelInfo() {
  const res = await fetch(`${API_BASE}/predict/model-info`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch DL model info');
  return await res.json();
}

// ── Active Learning & Review Queue ───────────────────────────────────────────
export async function getReviewQueue(projectId) {
  const res = await fetch(`${API_BASE}/review-queue/${projectId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch review queue');
  const data = await res.json();
  return {
    ...data,
    items: (data.items || []).map((item) => ({
      ...item,
      url: resolveMediaUrl(item.url),
    })),
  };
}

export async function triggerRetrain(payload = {}) {
  const res = await fetch(`${API_BASE}/review-queue/trigger-retrain`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to trigger model retraining');
  }
  return await res.json();
}

export async function getProgress(projectId) {
  const res = await fetch(`${API_BASE}/progress/${projectId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) throw new Error('Failed to fetch progress metrics');
  return await res.json();
}

export async function getReviewCycles(projectId) {
  const res = await fetch(`${API_BASE}/review-queue/cycles/${projectId}`, {
    headers: getAuthHeaders(false),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}


