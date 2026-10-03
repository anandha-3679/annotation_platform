import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  Sparkles,
  UploadCloud,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function TopBar({ onUploadClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = React.useState('');

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length === 0 || parts[0] === 'dashboard') {
      return [{ label: 'MEDORA', path: '/dashboard' }, { label: 'Home Dashboard' }];
    }
    if (parts[0] === 'projects') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Projects & Studies' }];
    }
    if (parts[0] === 'project') {
      return [{ label: 'Projects', path: '/projects' }, { label: 'Cohort Detail' }];
    }
    if (parts[0] === 'annotate') {
      return [{ label: 'Projects', path: '/projects' }, { label: 'Canva Annotation Studio' }];
    }
    if (parts[0] === 'active-learning') {
      return [{ label: 'Home', path: '/dashboard' }, { label: 'Active Learning Feedback Loop' }];
    }
    return [{ label: 'MEDORA', path: '/dashboard' }, { label: parts[0] }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="medora-topbar">
      {/* Left: Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight size={14} color="var(--text-muted)" />}
            {crumb.path ? (
              <span
                onClick={() => navigate(crumb.path)}
                style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 }}
              >
                {crumb.label}
              </span>
            ) : (
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Center: Canva-style Search Input */}
      <div className="topbar-search-box">
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search patient ID, DICOM accession, or findings (Press Enter)..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/projects?search=${encodeURIComponent(searchVal.trim())}`);
            }
          }}
        />
      </div>

      {/* Right: Actions */}
      <div className="topbar-actions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/active-learning')}
          style={{ gap: '6px', fontSize: '12px', padding: '6px 12px' }}
          title="Active Learning Model Status"
        >
          <Sparkles size={14} color="var(--primary-600)" />
          <span>Active Loop: Iteration 4</span>
        </button>

        <button
          className="btn btn-gradient"
          onClick={onUploadClick || (() => navigate('/projects'))}
          style={{ fontSize: '13px', padding: '7px 16px' }}
        >
          <Plus size={16} />
          <span>New Study</span>
        </button>

        <button className="btn btn-ghost btn-icon" title="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
