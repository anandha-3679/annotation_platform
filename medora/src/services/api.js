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

export const FALLBACK_COHORTS = [
  {
    id: 'proj-1',
    name: 'Chest PA — ICU Cohort',
    description: 'Acute respiratory distress syndrome & pleural fluid monitoring',
    status: 'active',
    total_images: 48,
    annotated_images: 32,
  },
  {
    id: 'proj-2',
    name: 'Cardiomegaly Pilot',
    description: 'Cardiothoracic ratio boundary measurement and heart silhouette trial',
    status: 'active',
    total_images: 120,
    annotated_images: 85,
  },
  {
    id: 'proj-3',
    name: 'Pneumothorax Urgents',
    description: 'Tension pneumothorax line segmentation and urgent pleural air detection',
    status: 'active',
    total_images: 14,
    annotated_images: 9,
  },
  {
    id: 'proj-4',
    name: 'Normal Baseline Scans',
    description: 'Reference chest radiographs with clear pulmonary parenchymal margins',
    status: 'active',
    total_images: 85,
    annotated_images: 85,
  },
];

export const FALLBACK_IMAGES = [
  {
    id: 'img-101',
    project_id: 'proj-1',
    url: '/sample-xray.png',
    original_name: 'PA_CHEST_ICU_CASE_01.png',
    width_px: 1024,
    height_px: 1024,
    status: 'in_review',
    confidence: 88.4,
    has_annotation: false,
  },
  {
    id: 'img-102',
    project_id: 'proj-1',
    url: '/sample-xray.png',
    original_name: 'PA_CHEST_ICU_CASE_02.png',
    width_px: 1024,
    height_px: 1024,
    status: 'pending',
    confidence: 72.1,
    has_annotation: false,
  },
  {
    id: 'img-103',
    project_id: 'proj-1',
    url: '/sample-xray.png',
    original_name: 'PA_CHEST_ICU_CASE_03.png',
    width_px: 1024,
    height_px: 1024,
    status: 'done',
    confidence: 94.0,
    has_annotation: true,
  },
];

// ── Projects / Cohorts ────────────────────────────────────────────────────────
export async function getProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders(false),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('Backend API unreachable, using clinical cohort fallback:', err);
  }
  return FALLBACK_COHORTS;
}

export async function getProject(projectId) {
  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      headers: getAuthHeaders(false),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Could not fetch project details:', err);
  }
  return FALLBACK_COHORTS.find((p) => p.id === projectId) || FALLBACK_COHORTS[0];
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
  try {
    const res = await fetch(`${API_BASE}/images/${projectId}`, {
      headers: getAuthHeaders(false),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((img) => ({
          ...img,
          url: resolveMediaUrl(img.url),
        }));
      }
    }
  } catch (err) {
    console.warn('Could not fetch project images, using fallback radiographs:', err);
  }
  return FALLBACK_IMAGES;
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
