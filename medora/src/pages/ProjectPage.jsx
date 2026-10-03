import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  Filter,
  Search,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  Brain,
  Layers,
  UploadCloud,
  FileImage,
} from 'lucide-react';
import { getProjects, getProjectImages, uploadImage } from '../services/api';

export default function ProjectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Sync state if URL query params change
  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter) setFilter(urlFilter);
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null) setSearchQuery(urlSearch);
  }, [searchParams]);

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load projects and determine active cohort
  useEffect(() => {
    let mounted = true;
    getProjects()
      .then((projs) => {
        if (!mounted) return;
        setProjects(projs);
        if (projs.length > 0) {
          const selected = id ? projs.find((p) => p.id === id) : projs[0];
          setActiveProject(selected || projs[0]);
        }
      })
      .catch((err) => console.warn('Could not load projects:', err));

    return () => {
      mounted = false;
    };
  }, [id]);

  // Load images whenever activeProject changes
  const loadImages = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await getProjectImages(activeProject.id);
      setImages(data);
    } catch (err) {
      console.warn('Could not load images for project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [activeProject]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeProject) return;
    setUploading(true);
    try {
      await uploadImage(activeProject.id, file);
      await loadImages();
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Filter images based on search query and status pill
  const filteredImages = images.filter((img) => {
    const matchesSearch =
      img.original_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.id?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'needs_review') {
      return img.status === 'pending' || img.status === 'in_review';
    }
    if (filter === 'completed') {
      return img.status === 'done';
    }
    if (filter === 'active_learning') {
      return img.status === 'in_review';
    }
    return true; // 'all'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/dashboard')}
            style={{ marginBottom: '8px', padding: '4px 8px', fontSize: '13px', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>
            {activeProject ? activeProject.name : 'Radiographic Studies Gallery'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeProject?.description || 'Inspect radiographs, verify AI masks, and export clinical annotations.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="btn btn-secondary" style={{ cursor: uploading ? 'wait' : 'pointer' }}>
            <UploadCloud size={16} />
            <span>{uploading ? 'Uploading...' : 'Upload Radiograph'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.dcm"
              style={{ display: 'none' }}
              disabled={uploading || !activeProject}
              onChange={handleFileUpload}
            />
          </label>
          <button
            className="btn btn-gradient"
            onClick={() => {
              if (images.length > 0) {
                navigate(`/annotate?imageId=${images[0].id}`);
              } else {
                navigate('/annotate');
              }
            }}
          >
            <Sparkles size={16} />
            <span>Open Studio</span>
          </button>
        </div>
      </div>

      {/* Cohort Switcher Tabs (if multiple projects exist) */}
      {projects.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', overflowX: 'auto' }}>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p)}
              className="btn btn-ghost"
              style={{
                fontSize: '13px',
                fontWeight: activeProject?.id === p.id ? '700' : '500',
                color: activeProject?.id === p.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                borderBottom: activeProject?.id === p.id ? '2px solid var(--primary-600)' : 'none',
                borderRadius: '0',
                padding: '6px 12px',
              }}
            >
              {p.name} ({p.total_images || 0})
            </button>
          ))}
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by accession number or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '36px' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Studies' },
            { id: 'needs_review', label: 'Needs Review', icon: Clock },
            { id: 'active_learning', label: 'In Review Queue', icon: Sparkles },
            { id: 'completed', label: 'Completed', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className="btn btn-ghost"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  height: '32px',
                  padding: '0 12px',
                  background: active ? 'var(--primary-100)' : 'transparent',
                  color: active ? 'var(--primary-700)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                }}
              >
                {Icon && <Icon size={14} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Image Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading chest radiographs...
        </div>
      ) : filteredImages.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-light)',
          }}
        >
          <FileImage size={48} color="var(--primary-300)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>No radiographs found</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Upload chest X-ray images (PNG, JPEG, DICOM) to begin reviewing AI masks.
          </p>
          <label className="btn btn-gradient" style={{ marginTop: '16px', cursor: 'pointer', display: 'inline-flex' }}>
            <UploadCloud size={16} />
            <span>Upload Radiograph</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.dcm"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredImages.map((img) => {
            const isDone = img.status === 'done';
            const isInReview = img.status === 'in_review';

            return (
              <div
                key={img.id}
                className="study-card"
                onClick={() => navigate(`/annotate?imageId=${img.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="study-card-thumb" style={{ height: '220px', background: '#000000' }}>
                  <img
                    src={img.url}
                    alt={img.original_name}
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.src = '/sample-xray.png';
                    }}
                  />
                  <div
                    className="study-card-tag"
                    style={{
                      background: isDone
                        ? 'var(--color-success)'
                        : isInReview
                        ? 'var(--primary-600)'
                        : 'var(--color-warning)',
                    }}
                  >
                    {isDone ? 'DOCTOR VERIFIED' : isInReview ? 'IN REVIEW' : 'PENDING'}
                  </div>
                </div>

                <div className="study-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-600)' }}>
                      {img.original_name || 'CHEST_RADIOGRAPH.png'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {img.width_px && img.height_px ? `${img.width_px} × ${img.height_px}` : '1024 × 1024'}
                    </span>
                  </div>

                  <div className="study-card-title" style={{ fontSize: '14px', marginTop: '6px' }}>
                    ID: {img.id.slice(0, 8)}...
                  </div>

                  {img.confidence && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Brain size={14} color="var(--primary-600)" />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        AI Confidence: {img.confidence}%
                      </span>
                    </div>
                  )}

                  <div className="study-card-footer" style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {img.has_annotation ? 'Mask Saved' : 'Ready to Annotate'}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-600)' }}>
                      Annotate →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
