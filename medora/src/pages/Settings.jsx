import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Cpu,
  Shield,
  Key,
  Users,
  FolderKanban,
  CheckCircle2,
  Lock,
  UserPlus,
  Trash2,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'admin' | 'services'

  // Admin state simulation
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Dr. Anandha Lakshmi', email: 'radiologist@medora.health', role: 'Admin Radiologist', status: 'Active' },
    { id: '2', name: 'Dr. Marcus Vance', email: 'm.vance@apexhealth.org', role: 'Staff Radiologist', status: 'Active' },
    { id: '3', name: 'Elena Rostova', email: 'elena@ml-research.ai', role: 'ML Engineer', status: 'Active' },
  ]);

  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800' }}>Platform Settings & Administration</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure user roles, PACS integration endpoints, and active learning pipeline parameters.
        </p>
      </div>

      {toastMsg && (
        <div
          style={{
            background: 'var(--color-success-bg)',
            border: '1px solid #a7f3d0',
            color: 'var(--color-success)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          <Shield size={15} />
          <span>User Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          <Users size={15} />
          <span>Team & Roles (Admin)</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          <Database size={15} />
          <span>System Endpoints</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 800,
              }}
            >
              AL
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{user?.user_metadata?.full_name || 'Dr. Anandha Lakshmi'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {user?.email || 'radiologist@medora.health'} • Primary Clinical Lead
              </div>
            </div>
            <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
              Full Administrator
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '10px' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" defaultValue={user?.user_metadata?.full_name || 'Dr. Anandha Lakshmi'} />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input type="text" className="form-input" defaultValue="Thoracic Radiology & Pulmonary Imaging" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn btn-primary" onClick={() => triggerToast('Profile preferences updated ✦')}>
              Save Profile Changes
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Admin Team & Roles */}
      {activeTab === 'admin' && (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Access Control & Radiologist Roster</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Manage permissions for annotating cohorts, reviewing AI suggestions, and exporting models.
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => triggerToast('Invite link generated for new clinical reviewer ✦')}
              style={{ fontSize: '13px' }}
            >
              <UserPlus size={14} />
              <span>Invite Reviewer</span>
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 24px' }}>Name & Email</th>
                <th style={{ padding: '12px 16px' }}>Assigned Role</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ fontWeight: 600 }}>{member.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600 }}>
                      {member.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-success">{member.status}</span>
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => triggerToast(`Permissions updated for ${member.name} ✦`)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: System Endpoints */}
      {activeTab === 'services' && (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <Database size={20} color="var(--primary-600)" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>Supabase PostgreSQL Pooler</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project: hjufvfqgyfbpmqkssiqy • Port 5432 Session Pool</div>
            </div>
            <span className="panel-badge" style={{ marginLeft: 'auto', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              Connected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <Cpu size={20} color="var(--primary-600)" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>FastAPI Model Service Worker</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Local REST: http://localhost:8000 • Hot-swappable U-Net v2.1</div>
            </div>
            <span className="panel-badge" style={{ marginLeft: 'auto', background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
              Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Key size={20} color="var(--primary-600)" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>Security Transport</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FastAPI-Users JWT Bearer Authentication • CORS Configured</div>
            </div>
            <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
              Enforced
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
