import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Lock, Save } from 'lucide-react';
import { getTeamInfo } from '../lib/flags';

export default function MatchCard({ match, userId, initialPrediction }) {
  const [homeScore, setHomeScore] = useState(initialPrediction?.home_score_pred ?? '');
  const [awayScore, setAwayScore] = useState(initialPrediction?.away_score_pred ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Ensure the timestamp is treated as UTC if the database omitted the timezone (fixes early locking in Australia/India)
  let timeStr = match.kickoff_time.replace(' ', 'T'); // Supabase sometimes returns spaces instead of T
  if (!/(Z|[+-]\d{2}(:\d{2})?)$/.test(timeStr)) {
    timeStr += 'Z';
  }
  const kickoff = new Date(timeStr);
  const isLocked = new Date() >= kickoff || match.status === 'completed' || match.status === 'finished' || match.home_score !== null;

  const formattedDate = kickoff.toLocaleString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  });

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from('predictions').upsert(
      {
        user_id: userId,
        match_id: match.id,
        home_score_pred: parseInt(homeScore),
        away_score_pred: parseInt(awayScore)
      },
      { onConflict: 'user_id, match_id' }
    );

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const homeInfo = getTeamInfo(match.home_team);
  const awayInfo = getTeamInfo(match.away_team);

  return (
    <div className={`glass-panel match-card ${isLocked ? 'locked' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLocked ? '#ef4444' : 'var(--accent)', boxShadow: `0 0 8px ${isLocked ? '#ef4444' : 'var(--accent)'}` }}></span>
          {match.stage} {match.multiplier > 1 && <strong style={{color: 'var(--accent)'}}>(x{match.multiplier} Pts)</strong>}
        </span>
        <span>{formattedDate}</span>
      </div>

      {/* Full Team Names Label */}
      <div style={{ textAlign: 'center', width: '100%', fontSize: '1.05rem', fontWeight: 700, margin: '0.25rem 0', color: 'var(--text-main)', lineHeight: 1.3 }}>
        {match.home_team} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem', margin: '0 0.5rem' }}>vs</span> {match.away_team}
      </div>

      {/* Grid Layout for Flags and Scores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
        
        {/* Home Flag & Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          {homeInfo.flag ? (
            <img src={homeInfo.flag} alt={match.home_team} className="team-flag" />
          ) : (
            <div className="flag-placeholder">?</div>
          )}
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{homeInfo.fifa}</span>
        </div>
        
        {/* Score Inputs Center */}
        <div className="score-center-panel" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
          <input 
            type="number" 
            min="0"
            max="20"
            className="input-field score-input" 
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            placeholder="-"
          />
          <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '1.2rem' }}>:</span>
          <input 
            type="number" 
            min="0"
            max="20"
            className="input-field score-input" 
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            placeholder="-"
          />
        </div>

        {/* Away Flag & Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
          {awayInfo.flag ? (
            <img src={awayInfo.flag} alt={match.away_team} className="team-flag" />
          ) : (
            <div className="flag-placeholder">?</div>
          )}
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{awayInfo.fifa}</span>
        </div>
      </div>

      {/* Action Area */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
        {isLocked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
            {match.home_score !== null && match.away_score !== null ? (
              <><Check size={16} color="var(--secondary)" /> Final Score: <span style={{ color: 'var(--text-main)', fontSize: '1.1rem', margin: '0 0.25rem' }}>{match.home_score} - {match.away_score}</span></>
            ) : (
              <><Lock size={16} /> Match Locked</>
            )}
          </div>
        ) : (
          <button 
            className={`btn btn-primary prediction-btn ${saved ? 'success' : ''}`}
            style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 600, width: '100%', maxWidth: '250px', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            onClick={handleSave}
            disabled={saving || homeScore === '' || awayScore === ''}
          >
            {saving ? 'Saving...' : saved ? <><Check size={18}/> Saved!</> : <><Save size={18}/> Save Prediction</>}
          </button>
        )}
      </div>
    </div>
  );
}
