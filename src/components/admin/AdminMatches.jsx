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

    try {
      let response;
      try {
        response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
          headers: { 'X-Auth-Token': '8847953b15df4660b1c78ecd81299f12' }
        });
      } catch (err) {
        // Fallback to CORS proxy if direct fetch fails
        response = await fetch('https://corsproxy.io/?https://api.football-data.org/v4/competitions/WC/matches', {
          headers: { 'X-Auth-Token': '8847953b15df4660b1c78ecd81299f12' }
        });
      }

      if (!response || !response.ok) {
        throw new Error(`API returned status ${response?.status || 'unknown'}`);
      }

      const data = await response.json();
      const apiMatches = data.matches || [];

      if (apiMatches.length === 0) {
        setSyncMessage({ type: 'info', text: 'API fetched successfully, but no matches were found for competition WC.' });
        setSyncing(false);
        return;
      }

      const normalize = (name) => {
        if (!name) return '';
        return name.toLowerCase().replace('united states', 'usa').replace(/[^a-z0-9]/g, '');
      };

      const updates = [];
      const updatedMatchesMap = {};

      for (const dbMatch of matches) {
        const apiMatch = apiMatches.find(am => {
          const amHome = normalize(am.homeTeam?.name || am.homeTeam?.shortName);
          const amAway = normalize(am.awayTeam?.name || am.awayTeam?.shortName);
          const dbHome = normalize(dbMatch.home_team);
          const dbAway = normalize(dbMatch.away_team);
          return (amHome === dbHome && amAway === dbAway) || (amHome === dbAway && amAway === dbHome);
        });

        if (apiMatch && apiMatch.status === 'FINISHED') {
          const homeScore = apiMatch.score?.fullTime?.home ?? apiMatch.score?.regularTime?.home;
          const awayScore = apiMatch.score?.fullTime?.away ?? apiMatch.score?.regularTime?.away;

          if (homeScore !== null && homeScore !== undefined && 
             (dbMatch.home_score !== homeScore || dbMatch.away_score !== awayScore || dbMatch.status !== 'finished')) {
            updates.push({
              id: dbMatch.id,
              home_score: homeScore,
              away_score: awayScore,
              status: 'finished'
            });
            updatedMatchesMap[dbMatch.id] = { home_score: homeScore, away_score: awayScore, status: 'finished' };
          }
        }
      }

      if (updates.length === 0) {
        setSyncMessage({ type: 'success', text: `Checked ${apiMatches.length} live matches. All finished match scores are already up to date!` });
      } else {
        // Apply updates to Supabase
        for (const update of updates) {
          await supabase.from('matches').update({
            home_score: update.home_score,
            away_score: update.away_score,
            status: update.status
          }).eq('id', update.id);
        }

        // Update local state
        setMatches(matches.map(m => updatedMatchesMap[m.id] ? { ...m, ...updatedMatchesMap[m.id] } : m));
        setSyncMessage({ type: 'success', text: `Successfully synced and updated ${updates.length} finished matches from live API!` });
      }
    } catch (error) {
      console.error("API Sync Error:", error);
      setSyncMessage({ type: 'error', text: `Failed to sync live scores: ${error.message}. Check your API token or network connection.` });
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
