import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Folder,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export default function ProjectPanel({ isCollapsed, onToggle }) {
  const location = useLocation();

  // If in active annotation workspace, panel can default to collapsed for maximum canvas focus
  const isWorkspace = location.pathname.startsWith('/annotate');

  const cohorts = [
    { id: 'proj-1', title: 'Chest PA — ICU Cohort', count: 48, status: 'In Review' },
    { id: 'proj-2', title: 'Cardiomegaly Pilot', count: 120, status: 'Active ML' },
    { id: 'proj-3', title: 'Pneumothorax Urgents', count: 14, status: 'Needs Review' },
    { id: 'proj-4', title: 'Normal Baseline Scans', count: 85, status: 'Completed' },
  ];

  return (
    <aside
      className={`medora-secondary-panel ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Project Explorer"
    >
      <div className="panel-header">
        <span className="panel-title">Cohorts & Folders</span>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onToggle}
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          style={{ width: '28px', height: '28px' }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="panel-content">
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 8px' }}>
          Filters
        </div>

        <NavLink
          to="/projects"
          end
          className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>All Studies</span>
          <span className="panel-badge">267</span>
        </NavLink>

        <NavLink
          to="/projects?filter=needs_review"
          className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`}
        >
          <Clock size={16} color="var(--color-warning)" />
          <span>Needs Review</span>
          <span className="panel-badge" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            19
          </span>
        </NavLink>

        <NavLink
          to="/projects?filter=active_learning"
          className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`}
        >
          <Sparkles size={16} color="var(--primary-600)" />
          <span>Active Learning Pool</span>
          <span className="panel-badge" style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
            32
          </span>
        </NavLink>

        <NavLink
          to="/projects?filter=completed"
          className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`}
        >
          <CheckCircle2 size={16} color="var(--color-success)" />
          <span>Doctor Verified</span>
          <span className="panel-badge" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            216
          </span>
        </NavLink>

        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '16px 8px 6px' }}>
          Recent Cohorts
        </div>

        {cohorts.map((cohort) => (
          <NavLink
            key={cohort.id}
            to={`/project/${cohort.id}`}
            className={({ isActive }) => `panel-link ${isActive ? 'active' : ''}`}
          >
            <Folder size={16} color="var(--primary-500)" />
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div>{cohort.title}</div>
            </div>
            <span className="panel-badge">{cohort.count}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
