import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from './MatchCard';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export default function MatchList({ session }) {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userId = session.user.id;

        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_time', { ascending: true });

        if (matchesError) throw matchesError;

        const { data: predsData, error: predsError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId);

        if (predsError) throw predsError;

        const predsMap = {};
        predsData.forEach(p => {
          predsMap[p.match_id] = p;
        });

        setMatches(matchesData || []);
        setPredictions(predsMap);
      } catch (err) {
        console.error('Failed to load matches:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session]);

  if (loading) {
    return <p className="text-muted">Loading matches...</p>;
  }

  if (error) {
    return <p style={{ color: '#ef4444' }}>Error: {error}</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem' }}>Matches</h3>
        <p style={{ color: 'var(--text-muted)' }}>No matches scheduled yet.</p>
      </div>
    );
  }

  const todayStr = new Date().toDateString();
  const now = new Date();

  const completedMatches = [];
  const todaysMatches = [];
  const upcomingMatches = [];

  matches.forEach(match => {
    let timeStr = match.kickoff_time.replace(' ', 'T');
    if (!/(Z|[+-]\d{2}(:\d{2})?)$/.test(timeStr)) {
      timeStr += 'Z';
    }
    const kickoff = new Date(timeStr);
    const isToday = kickoff.toDateString() === todayStr;
    const isPast = kickoff < now;
    const isFinished = match.status === 'finished' || match.status === 'completed' || match.home_score !== null;

    if (isToday || (isPast && !isFinished)) {
      todaysMatches.push(match);
    } else if (isFinished) {
      completedMatches.push(match);
    } else {
      upcomingMatches.push(match);
    }
  });

  const renderGrid = (list) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
      {list.map(match => (
        <MatchCard 
          key={match.id} 
          match={match} 
          userId={session.user.id} 
          initialPrediction={predictions[match.id]} 
        />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Completed Matches (Collapsible) */}
      {completedMatches.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            style={{ 
              width: '100%', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-main)', 
              cursor: 'pointer',
              padding: '0.5rem 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                {showCompleted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Past Completed Matches ({completedMatches.length})</h3>
            </div>
          </button>
          
          {showCompleted && renderGrid(completedMatches)}
        </div>
      )}

      {/* 2. Today's Matches */}
      {todaysMatches.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Calendar size={24} color="var(--primary)" />
            <h3 className="text-primary-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Active & Today's Matches</h3>
          </div>
          {renderGrid(todaysMatches)}
        </div>
      )}

      {/* 3. Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div style={{ marginTop: todaysMatches.length > 0 ? '1rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-muted)' }}>Upcoming Matches</h3>
          </div>
          {renderGrid(upcomingMatches)}
        </div>
      )}
      
      {todaysMatches.length === 0 && upcomingMatches.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No upcoming matches scheduled.</p>
        </div>
      )}
      
    </div>
  );
}
