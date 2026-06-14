import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, LayoutDashboard, Users, Trophy, Activity, BarChart2 } from 'lucide-react';
import AdminOverview from './admin/AdminOverview';
import AdminMatches from './admin/AdminMatches';
import AdminUsers from './admin/AdminUsers';
import AdminLeagues from './admin/AdminLeagues';
import AdminReports from './admin/AdminReports';

export default function AdminDashboard({ session }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function checkAdmin() {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
        
      if (userData?.is_admin) {
        setIsAdmin(true);
      }
      setLoading(false);
    }
    checkAdmin();
  }, [session]);

  if (loading) return <p>Loading Admin Dashboard...</p>;

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <Shield size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2>Access Denied</h2>
        <p className="text-muted">You do not have administrator privileges.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'matches', label: 'Matches', icon: <Activity size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'leagues', label: 'Leagues', icon: <Trophy size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview />;
      case 'matches': return <AdminMatches />;
      case 'users': return <AdminUsers />;
      case 'leagues': return <AdminLeagues />;
      case 'reports': return <AdminReports />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Shield size={28} color="#ef4444" />
        <h2 className="text-primary-gradient">Admin Command Center</h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              borderRadius: '8px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '1rem' }}>
        {renderContent()}
      </div>
    </div>
  );
}
