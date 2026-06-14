import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Hash, Users } from 'lucide-react';

export default function AdminLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeagues() {
      // Fetch leagues and their members
      const { data: leaguesData } = await supabase.from('leagues').select('*');
      const { data: membersData } = await supabase.from('league_members').select('league_id');
      
      if (leaguesData && membersData) {
        // Calculate member counts
        const memberCounts = membersData.reduce((acc, curr) => {
          acc[curr.league_id] = (acc[curr.league_id] || 0) + 1;
          return acc;
        }, {});

        const combined = leaguesData.map(l => ({
          ...l,
          memberCount: memberCounts[l.id] || 0
        })).sort((a, b) => b.memberCount - a.memberCount);

        setLeagues(combined);
      }
      setLoading(false);
    }
    loadLeagues();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 className="loading-spinner" size={32} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>League Management</h3>
      
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem 0.75rem' }}>League Name</th>
                <th style={{ padding: '1rem 0.75rem' }}>Invite Code</th>
                <th style={{ padding: '1rem 0.75rem' }}>Members</th>
                <th style={{ padding: '1rem 0.75rem' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {leagues.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No private leagues found.</td></tr>
              ) : leagues.map((league) => (
                <tr key={league.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{league.name}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Hash size={14} /> {league.invite_code}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} /> {league.memberCount}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(league.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
