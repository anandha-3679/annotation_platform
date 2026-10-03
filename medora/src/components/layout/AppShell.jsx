import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProjectPanel from './ProjectPanel';
import TopBar from './TopBar';

export default function AppShell() {
  const location = useLocation();
  const isAnnotateStudio = location.pathname.startsWith('/annotate');
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // If inside the Annotation Workspace studio, it has its own specialized Canva editor layout
  if (isAnnotateStudio) {
    return <Outlet />;
  }

  return (
    <div className="medora-shell">
      {/* Column 1: Canva 64px Left Rail */}
      <Sidebar />

      {/* Column 2: Collapsible 240px Cohort / Folder Panel */}
      <ProjectPanel
        isCollapsed={panelCollapsed}
        onToggle={() => setPanelCollapsed(!panelCollapsed)}
      />

      {/* Column 3: Main Viewport */}
      <main className="medora-main">
        <TopBar />
        <div className="content-viewport">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
