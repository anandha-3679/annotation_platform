import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  PenTool,
  BrainCircuit,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Projects', icon: FolderKanban, path: '/projects' },
    { label: 'Annotate', icon: PenTool, path: '/annotate' },
    { label: 'Active ML', icon: BrainCircuit, path: '/active-learning' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'DR';

  return (
    <aside className="medora-rail" aria-label="Main Navigation">
      {/* Brand Logo */}
      <div className="rail-brand" onClick={() => navigate('/dashboard')} title="MEDORA Home">
        <img src="/logo.jpg" alt="MEDORA Logo" className="rail-logo" />
      </div>

      {/* Main Nav Items */}
      <nav className="rail-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rail-item ${isActive ? 'active' : ''}`
              }
              title={item.label}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="rail-footer">
        <NavLink
          to="/guidelines"
          className={({ isActive }) => `rail-item ${isActive ? 'active' : ''}`}
          title="Clinical Documentation & Guidelines"
        >
          <HelpCircle size={18} />
          <span>Help</span>
        </NavLink>

        <div
          className="user-avatar-mini"
          title={`${user?.user_metadata?.full_name || 'Radiologist'} (${user?.user_metadata?.role || 'Doctor'})`}
          onClick={handleLogout}
        >
          {initials}
        </div>
      </div>
    </aside>
  );
}
