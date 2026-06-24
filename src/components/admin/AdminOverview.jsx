import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Activity, Trophy, CheckCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    predictions: 0,
    leagues: 0,
    finishedMatches: 0
  });
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState(null);

  useEffect(() => {
    async function loadStats() {
      // Fetch counts in parallel
      const [
        { count: usersCount },
        { count: predictionsCount },
        { count: leaguesCount },
        { count: finishedMatchesCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('predictions').select('*', { count: 'exact', head: true }),
        supabase.from('leagues').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).not('home_score', 'is', null)
      ]);

      setStats({
        users: usersCount || 0,
        predictions: predictionsCount || 0,
        leagues: leaguesCount || 0,
        finishedMatches: finishedMatchesCount || 0
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const handleRecalculate = async () => {
    if (!window.confirm("Are you sure you want to recalculate all points? This will instantly resync all user predictions and total leaderboard standings.")) {
      return;
    }
    
    setRecalculating(true);
    setRecalcMessage(null);

    const { error } = await supabase.rpc('recalculate_all_points');

    if (error) {
      console.error("Error recalculating points:", error);
      setRecalcMessage({ type: 'error', text: `Recalculation failed: ${error.message}. Make sure you have run the required SQL script in Supabase!` });
    } else {
      setRecalcMessage({ type: 'success', text: 'All user points and percentages have been successfully recalculated and resynced!' });
    }
    
    setRecalculating(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 className="loading-spinner" size={32} />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: <Users size={32} color="var(--primary)" /> },
    { label: 'Total Predictions', value: stats.predictions, icon: <Activity size={32} color="var(--secondary)" /> },
    { label: 'Private Leagues', value: stats.leagues, icon: <Trophy size={32} color="var(--accent)" /> },
    { label: 'Finished Matches', value: stats.finishedMatches, icon: <CheckCircle size={32} color="#10b981" /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Maintenance & Recalculation Panel */}
      <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={22} color="var(--primary)" /> System Maintenance & Recalculation
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '600px', fontSize: '0.95rem' }}>
              If you suspect a points mismatch or if match scores were updated outside the normal flow, you can instantly force a complete mathematical recalculation of all predictions and leaderboard standings.
            </p>
          </div>
          
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              padding: '0.85rem 1.5rem',
              background: 'var(--primary-gradient)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: recalculating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {recalculating ? (
              <>
                <Loader2 size={18} className="loading-spinner" /> Recalculating...
              </>
            ) : (
              <>
                <RefreshCw size={18} /> Recalculate All Points
              </>
            )}
          </button>
        </div>

        {recalcMessage && (
          <div 
            style={{ 
              marginTop: '1.5rem', 
              padding: '1rem 1.25rem', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              background: recalcMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${recalcMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: recalcMessage.type === 'success' ? '#10b981' : '#ef4444',
              fontWeight: 600
            }}
          >
            <AlertCircle size={20} />
            <span>{recalcMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
