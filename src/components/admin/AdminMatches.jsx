import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Save, RefreshCw, Globe, AlertCircle } from 'lucide-react';

export default function AdminMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  useEffect(() => {
    async function loadMatches() {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_time', { ascending: true });
      if (data) setMatches(data);
      setLoading(false);
    }
    loadMatches();
  }, []);

  const handleUpdateMatch = async (matchId, updates) => {
    setSavingId(matchId);
    const { error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId);

    if (error) {
      alert('Error updating match: ' + error.message);
    } else {
      setMatches(matches.map(m => m.id === matchId ? { ...m, ...updates } : m));
    }
    setSavingId(null);
  };

  const handleSyncApi = async () => {
    setSyncing(true);
    setSyncMessage(null);

    const { data, error } = await supabase.rpc('sync_football_data');

    if (error) {
      console.error("API Sync Error:", error);
      setSyncMessage({ type: 'error', text: `Failed to sync live scores: ${error.message}. Make sure the sync_football_data RPC is set up in Supabase.` });
    } else {
      // Reload matches from Supabase to get updated scores
      const { data: updatedMatches } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_time', { ascending: true });
      
      if (updatedMatches) setMatches(updatedMatches);
      
      setSyncMessage({ type: 'success', text: data || 'Successfully triggered live API sync and refreshed matches!' });
    }

    setSyncing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 className="loading-spinner" size={32} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Live API Sync Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={22} color="var(--secondary)" /> Live Match Data Sync
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '700px', fontSize: '0.95rem' }}>
              Fetch real-time records directly from the official football-data.org API. This will automatically match teams, pull down final scores for all finished World Cup games, and update them in the database.
            </p>
          </div>

          <button
            onClick={handleSyncApi}
            disabled={syncing}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'var(--secondary-gradient)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {syncing ? (
              <>
                <Loader2 size={18} className="loading-spinner" /> Fetching Live API...
              </>
            ) : (
              <>
                <RefreshCw size={18} /> Fetch & Update Scores
              </>
            )}
          </button>
        </div>

        {syncMessage && (
          <div 
            style={{ 
              padding: '1rem 1.25rem', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              background: syncMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : syncMessage.type === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${syncMessage.type === 'success' ? '#10b981' : syncMessage.type === 'info' ? '#3b82f6' : '#ef4444'}`,
              color: syncMessage.type === 'success' ? '#10b981' : syncMessage.type === 'info' ? '#3b82f6' : '#ef4444',
              fontWeight: 600
            }}
          >
            <AlertCircle size={20} />
            <span>{syncMessage.text}</span>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem' }}>Stage</th>
                <th style={{ padding: '1rem' }}>Teams</th>
                <th style={{ padding: '1rem' }}>Kickoff Time (UTC)</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Multiplier</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Score</th>
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
    </div>
  );
}

function AdminMatchRow({ match, onSave, saving }) {
  const [stage, setStage] = useState(match.stage || '');
  const [homeTeam, setHomeTeam] = useState(match.home_team || '');
  const [awayTeam, setAwayTeam] = useState(match.away_team || '');
  const [kickoff, setKickoff] = useState(match.kickoff_time?.slice(0, 16) || '');
  const [multiplier, setMultiplier] = useState(match.multiplier || 1);
  const [homeScore, setHomeScore] = useState(match.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.away_score ?? '');
  const [status, setStatus] = useState(match.status || 'scheduled');

  const handleSave = () => {
    onSave(match.id, {
      stage,
      home_team: homeTeam,
      away_team: awayTeam,
      kickoff_time: new Date(kickoff).toISOString(),
      multiplier: parseInt(multiplier) || 1,
      home_score: homeScore !== '' ? parseInt(homeScore) : null,
      away_score: awayScore !== '' ? parseInt(awayScore) : null,
      status
    });
  };

  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '1rem' }}>
        <input type="text" className="input-field" style={{ width: '90px', padding: '0.25rem' }} value={stage} onChange={e => setStage(e.target.value)} />
      </td>
      <td style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" className="input-field" style={{ width: '100px', padding: '0.25rem' }} value={homeTeam} onChange={e => setHomeTeam(e.target.value)} />
          <span>vs</span>
          <input type="text" className="input-field" style={{ width: '100px', padding: '0.25rem' }} value={awayTeam} onChange={e => setAwayTeam(e.target.value)} />
        </div>
      </td>
      <td style={{ padding: '1rem' }}>
        <input type="datetime-local" className="input-field" style={{ padding: '0.25rem' }} value={kickoff} onChange={e => setKickoff(e.target.value)} />
      </td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        <input type="number" className="input-field" style={{ width: '60px', padding: '0.25rem', textAlign: 'center' }} value={multiplier} onChange={e => setMultiplier(e.target.value)} min="1" />
      </td>
      <td style={{ padding: '1rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', justifyContent: 'center' }}>
          <input type="number" className="input-field" style={{ width: '40px', padding: '0.25rem', textAlign: 'center' }} value={homeScore} onChange={e => setHomeScore(e.target.value)} />
          <span>-</span>
          <input type="number" className="input-field" style={{ width: '40px', padding: '0.25rem', textAlign: 'center' }} value={awayScore} onChange={e => setAwayScore(e.target.value)} />
        </div>
      </td>
      <td style={{ padding: '1rem' }}>
        <select className="input-field" style={{ padding: '0.25rem', width: '110px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="scheduled">Scheduled</option>
          <option value="in_play">In Play</option>
          <option value="finished">Finished</option>
        </select>
      </td>
      <td style={{ padding: '1rem', textAlign: 'right' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 size={16} className="loading-spinner" /> : <Save size={16} />}
        </button>
      </td>
    </tr>
  );
}
