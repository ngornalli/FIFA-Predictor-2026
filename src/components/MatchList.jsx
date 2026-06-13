import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import MatchCard from './MatchCard';

export default function MatchList({ session }) {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const userId = session.user.id;

        // Fetch upcoming matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .order('kickoff_time', { ascending: true });

        if (matchesError) throw matchesError;

        // Fetch user's predictions
        const { data: predsData, error: predsError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId);

        if (predsError) throw predsError;

        // Map predictions by match_id for easy lookup
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
        <h3 style={{ marginBottom: '1rem' }}>Upcoming Matches</h3>
        <p style={{ color: 'var(--text-muted)' }}>No matches scheduled yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3 className="text-primary-gradient" style={{ fontSize: '1.5rem' }}>Upcoming Matches</h3>
      <div className="grid-matches" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {matches.map(match => (
          <MatchCard 
            key={match.id} 
            match={match} 
            userId={session.user.id} 
            initialPrediction={predictions[match.id]} 
          />
        ))}
      </div>
    </div>
  );
}
