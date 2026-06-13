import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, total_points')
        .order('total_points', { ascending: false })
        .limit(100);

      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    }
    loadLeaderboard();
  }, []);

  if (loading) return <p className="text-muted">Loading Global Leaderboard...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Trophy size={28} color="var(--accent)" />
        <h2 className="text-primary-gradient">Global Leaderboard</h2>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '1rem 1.5rem', width: '80px' }}>Rank</th>
              <th style={{ padding: '1rem 1.5rem' }}>Player</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Total Points</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No players found. Check back once matches begin!
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>
                    {index === 0 && <Award size={20} color="#fbbf24" style={{ verticalAlign: 'middle' }} />}
                    {index === 1 && <Medal size={20} color="#9ca3af" style={{ verticalAlign: 'middle' }} />}
                    {index === 2 && <Medal size={20} color="#b45309" style={{ verticalAlign: 'middle' }} />}
                    {index > 2 && <span style={{ paddingLeft: '4px' }}>{index + 1}</span>}
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                    <Link to={`/profile/${user.id}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {user.username}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {user.total_points}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
