import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Check, Shield } from 'lucide-react';

export default function AdminDashboard({ session }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
        
      if (userData?.is_admin) {
        setIsAdmin(true);
        const { data: matchesData } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_time', { ascending: true });
        setMatches(matchesData || []);
      }
      setLoading(false);
    }
    loadData();
  }, [session]);

  const handleUpdateMatch = async (matchId, homeScore, awayScore, status) => {
    setSavingId(matchId);
    
    const { error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore !== '' ? parseInt(homeScore) : null,
        away_score: awayScore !== '' ? parseInt(awayScore) : null,
        status: status
      })
      .eq('id', matchId);

    if (error) {
      alert('Error updating match: ' + error.message);
    } else {
      // Update local state
      setMatches(matches.map(m => m.id === matchId ? {
        ...m, 
        home_score: homeScore !== '' ? parseInt(homeScore) : null,
        away_score: awayScore !== '' ? parseInt(awayScore) : null,
        status: status
      } : m));
    }
    setSavingId(null);
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Shield size={28} color="var(--accent)" />
        <h2 className="text-primary-gradient">Admin Match Center</h2>
      </div>
      
      <p style={{ color: 'var(--text-muted)' }}>
        Update match scores and set status to "finished" to trigger automatic point calculation for all users.
      </p>

      <div style={{ overflowX: 'auto', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '1rem' }}>Match</th>
              <th style={{ padding: '1rem' }}>Stage</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Home Score</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Away Score</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <AdminMatchRow 
                key={match.id} 
                match={match} 
                onSave={handleUpdateMatch} 
                saving={savingId === match.id} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMatchRow({ match, onSave, saving }) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.away_score ?? '');
  const [status, setStatus] = useState(match.status);

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '1rem', fontWeight: 600 }}>{match.home_team} vs {match.away_team}</td>
      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{match.stage}</td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        <input 
          type="number" 
          className="input-field" 
          style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }}
          value={homeScore}
          onChange={e => setHomeScore(e.target.value)}
        />
      </td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        <input 
          type="number" 
          className="input-field" 
          style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }}
          value={awayScore}
          onChange={e => setAwayScore(e.target.value)}
        />
      </td>
      <td style={{ padding: '1rem' }}>
        <select 
          className="input-field" 
          style={{ padding: '0.25rem', width: 'auto' }}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="scheduled">Scheduled</option>
          <option value="in_play">In Play</option>
          <option value="finished">Finished</option>
        </select>
      </td>
      <td style={{ padding: '1rem', textAlign: 'right' }}>
        <button 
          className="btn btn-outline" 
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
          onClick={() => onSave(match.id, homeScore, awayScore, status)}
          disabled={saving}
        >
          {saving ? 'Saving...' : <><Save size={14} /> Update</>}
        </button>
      </td>
    </tr>
  );
}
