import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Lock, Save, Info } from 'lucide-react';
import { getTeamInfo } from '../lib/flags';

export default function MatchCard({ match, userId, initialPrediction }) {
  const [homeScore, setHomeScore] = useState(initialPrediction?.home_score_pred ?? '');
  const [awayScore, setAwayScore] = useState(initialPrediction?.away_score_pred ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const getBreakdown = () => {
    if (match.home_score === null || match.away_score === null || !initialPrediction) return null;
    const actualHome = match.home_score;
    const actualAway = match.away_score;
    const predHome = initialPrediction.home_score_pred;
    const predAway = initialPrediction.away_score_pred;
    
    let actualOutcome = actualHome > actualAway ? 'HOME' : actualHome < actualAway ? 'AWAY' : 'DRAW';
    let predOutcome = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'DRAW';
    
    let actualDiff = actualHome - actualAway;
    let predDiff = predHome - predAway;
    
    const breakdown = {
      outcome: actualOutcome === predOutcome ? 10 : 0,
      home: actualHome === predHome ? 5 : 0,
      away: actualAway === predAway ? 5 : 0,
      diff: actualDiff === predDiff ? 5 : 0,
      exact: actualHome === predHome && actualAway === predAway ? 5 : 0,
      multiplier: match.multiplier || 1
    };
    
    breakdown.total = (breakdown.outcome + breakdown.home + breakdown.away + breakdown.diff + breakdown.exact) * breakdown.multiplier;
    return breakdown;
  };

  const breakdown = getBreakdown();

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={16} color="var(--secondary)" /> Final Score: <span style={{ color: 'var(--text-main)', fontSize: '1.1rem', margin: '0 0.25rem' }}>{match.home_score} - {match.away_score}</span>
                </div>
                {initialPrediction && breakdown && (
                  <div 
                    onClick={() => setShowBreakdownModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '12px', cursor: 'pointer', color: breakdown.total > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}
                    title="Click to view points breakdown"
                  >
                    +{breakdown.total} Pts <Info size={14} />
                  </div>
                )}
              </div>
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

      {/* Breakdown Modal */}
      {showBreakdownModal && breakdown && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'inherit', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-main)' }}>Points Breakdown</h4>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Correct Outcome (10)</span>
              <strong style={{ color: breakdown.outcome > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>+{breakdown.outcome}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Correct Goals ({homeInfo.fifa}) (5)</span>
              <strong style={{ color: breakdown.home > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>+{breakdown.home}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Correct Goals ({awayInfo.fifa}) (5)</span>
              <strong style={{ color: breakdown.away > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>+{breakdown.away}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Correct Goal Difference (5)</span>
              <strong style={{ color: breakdown.diff > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>+{breakdown.diff}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span>Correct Score Bonus (5)</span>
              <strong style={{ color: breakdown.exact > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>+{breakdown.exact}</strong>
            </div>
            
            {breakdown.multiplier > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--accent)' }}>
                <span>Stage Multiplier</span>
                <strong>x{breakdown.multiplier}</strong>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
              <span>Total Points</span>
              <span style={{ color: 'var(--secondary)' }}>{breakdown.total} Pts</span>
            </div>
            
            <button 
              onClick={() => setShowBreakdownModal(false)}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
