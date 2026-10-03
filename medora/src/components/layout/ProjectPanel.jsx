import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Folder,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { getProjects, createProject } from '../../services/api';

export default function ProjectPanel({ isCollapsed, onToggle }) {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCohortModal, setShowNewCohortModal] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortDesc, setNewCohortDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const loadCohorts = async () => {
    try {
      const data = await getProjects();
      setCohorts(data);
    } catch (err) {
      console.warn('Could not load live projects, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCohorts();
  }, []);

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    if (!newCohortName.trim()) return;
    setCreating(true);
    try {
      const created = await createProject({
        name: newCohortName.trim(),
        description: newCohortDesc.trim(),
        status: 'active',
      });
      setNewCohortName('');
      setNewCohortDesc('');
      setShowNewCohortModal(false);
      await loadCohorts();
      navigate(`/project/${created.id}`);
    } catch (err) {
      alert(err.message || 'Failed to create cohort');
    } finally {
      setCreating(false);
    }
  };

  const totalStudies = cohorts.reduce((acc, c) => acc + (c.total_images || 0), 0);
  const totalAnnotated = cohorts.reduce((acc, c) => acc + (c.annotated_images || 0), 0);
  const pendingCount = Math.max(0, totalStudies - totalAnnotated);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentFilter = searchParams.get('filter');
  const isProjectsRoute = location.pathname === '/projects';

  return (
    <>
      {isCollapsed && (
        <button
          className="panel-expand-floating-btn"
          onClick={onToggle}
          title="Expand Cohorts & Folders"
          aria-label="Expand Cohorts & Folders"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <aside
        className={`medora-secondary-panel ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Project Explorer"
      >
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="panel-title">Cohorts & Folders</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowNewCohortModal(true)}
              title="Create New Cohort"
              style={{ width: '28px', height: '28px', color: 'var(--primary-600)' }}
            >
              <Plus size={16} />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onToggle}
              title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              style={{ width: '28px', height: '28px' }}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        <div className="panel-content">
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 8px' }}>
            Filters
          </div>

          <NavLink
            to="/projects"
            className={`panel-link ${isProjectsRoute && !currentFilter ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>All Studies</span>
            <span className="panel-badge">{totalStudies}</span>
          </NavLink>

          <NavLink
            to="/projects?filter=needs_review"
            className={`panel-link ${isProjectsRoute && currentFilter === 'needs_review' ? 'active' : ''}`}
          >
            <Clock size={16} color="var(--color-warning)" />
            <span>Needs Review</span>
            <span className="panel-badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              {pendingCount}
            </span>
          </NavLink>

          <NavLink
            to="/projects?filter=active_learning"
            className={`panel-link ${isProjectsRoute && currentFilter === 'active_learning' ? 'active' : ''}`}
          >
            <Sparkles size={16} color="var(--primary-600)" />
            <span>Active Learning Pool</span>
            <span className="panel-badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
              {cohorts.length * 4}
            </span>
          </NavLink>

          <NavLink
            to="/projects?filter=completed"
            className={`panel-link ${isProjectsRoute && currentFilter === 'completed' ? 'active' : ''}`}
          >
            <CheckCircle2 size={16} color="var(--color-success)" />
            <span>Doctor Verified</span>
            <span className="panel-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              {totalAnnotated}
            </span>
          </NavLink>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px 6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Live Cohorts
          </span>
          <span
            style={{ fontSize: '11px', color: 'var(--primary-600)', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => setShowNewCohortModal(true)}
          >
            + New
          </span>
        </div>

        {cohorts.map((cohort) => (
          <NavLink
            key={cohort.id}
            to={`/project/${cohort.id}`}
            className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`}
          >
            <Folder size={16} color="var(--primary-500)" />
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              <div>{cohort.name}</div>
            </div>
            <span className="panel-badge">{cohort.total_images || 0}</span>
          </NavLink>
        ))}
      </div>

      {/* New Cohort Modal */}
      {showNewCohortModal && (
        <div className="modal-overlay" onClick={() => setShowNewCohortModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Create Clinical Cohort</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowNewCohortModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateCohort}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Cohort Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Cardiomegaly Rapid Screen"
                    value={newCohortName}
                    onChange={(e) => setNewCohortName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Clinical Purpose</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Radiographs sampled for heart silhouette and cardiothoracic ratio annotation"
                    value={newCohortDesc}
                    onChange={(e) => setNewCohortDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewCohortModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-gradient">
                  {creating ? 'Creating...' : 'Create Cohort'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
