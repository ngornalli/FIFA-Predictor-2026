import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, ChevronDown } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  useEffect(() => {
    async function loadLeaderboard() {
      // Get current logged-in user
      const { data: authData } = await supabase.auth.getSession();
      setCurrentUserId(authData?.session?.user?.id);

      // Fetch leaderboard
      const { data, error } = await supabase
        .from('users')
        .select('id, username, total_points')
        .order('total_points', { ascending: false });

      if (!error && data) {
        // Assign rank
        const rankedData = data.map((u, i) => ({ ...u, rank: i + 1 }));
        setUsers(rankedData);
      }
      setLoading(false);
    }
    loadLeaderboard();
  }, []);

  if (loading) return <p className="text-muted">Loading Global Leaderboard...</p>;

  const displayedUsers = users.slice(0, displayLimit);
  const currentUserIndex = users.findIndex(u => u.id === currentUserId);
  const currentUser = currentUserIndex !== -1 ? users[currentUserIndex] : null;
  const isCurrentUserHidden = currentUserIndex >= displayLimit;

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
              <>
                {displayedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      transition: 'background 0.2s',
                      backgroundColor: user.id === currentUserId ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      borderLeft: user.id === currentUserId ? '4px solid var(--secondary)' : '4px solid transparent'
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>
                      {user.rank === 1 && <Award size={20} color="#fbbf24" style={{ verticalAlign: 'middle' }} />}
                      {user.rank === 2 && <Medal size={20} color="#9ca3af" style={{ verticalAlign: 'middle' }} />}
                      {user.rank === 3 && <Medal size={20} color="#b45309" style={{ verticalAlign: 'middle' }} />}
                      {user.rank > 3 && <span style={{ paddingLeft: '4px' }}>{user.rank}</span>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                      <Link to={`/profile/${user.id}`} style={{ color: user.id === currentUserId ? 'var(--secondary)' : 'inherit', textDecoration: 'none' }}>
                        {user.username} {user.id === currentUserId && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(You)</span>}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {user.total_points}
                    </td>
                  </tr>
                ))}

                {/* Sticky Current User Row if they are outside the displayed range */}
                {isCurrentUserHidden && currentUser && (
                  <>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                      <td colSpan="3" style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '2px' }}>
                        •••
                      </td>
                    </tr>
                    <tr 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        borderLeft: '4px solid var(--secondary)'
                      }}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>
                        <span style={{ paddingLeft: '4px' }}>{currentUser.rank}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                        <Link to={`/profile/${currentUser.id}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                          {currentUser.username} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(You)</span>
                        </Link>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {currentUser.total_points}
                      </td>
                    </tr>
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {users.length > displayLimit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button 
            className="btn btn-outline"
            style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => setDisplayLimit(prev => prev + 10)}
          >
            Load More <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
