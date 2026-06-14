import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Activity, Trophy, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    predictions: 0,
    leagues: 0,
    finishedMatches: 0
  });
  const [loading, setLoading] = useState(true);

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
        supabase.from('matches').select('*', { count: 'exact', head: true }).in('status', ['finished', 'completed'])
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
  );
}
