import React from 'react';
import { Settings as SettingsIcon, Database, Cpu, Shield, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: '800' }}>Platform Settings & Connections</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Configure Supabase integration, DICOM PACS endpoints, and active learning pipeline parameters.
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <Database size={20} color="var(--primary-600)" />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>Supabase Cloud Connection</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Project: hjufvfqgyfbpmqkssiqy (ap-northeast-1)</div>
          </div>
          <span className="panel-badge" style={{ marginLeft: 'auto', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
            PostgreSQL Live
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <Cpu size={20} color="var(--primary-600)" />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>Inference & Active Learning Worker</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FastAPI Service • http://localhost:8000</div>
          </div>
          <span className="panel-badge" style={{ marginLeft: 'auto', background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
            v2.1 U-Net Checkpoint
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={20} color="var(--primary-600)" />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700' }}>Active Radiologist Profile</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user?.user_metadata?.full_name || 'Dr. Specialist'} • {user?.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
