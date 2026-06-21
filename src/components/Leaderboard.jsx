import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, ChevronDown, X, Loader2 } from 'lucide-react';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);

  // Breakdown Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [userPredictions, setUserPredictions] = useState([]);

  useEffect(() => {
    async function loadLeaderboard() {
      // Get current logged-in user
      const { data: authData } = await supabase.auth.getSession();
      setCurrentUserId(authData?.session?.user?.id);

      // Fetch leaderboard using new Accuracy RPC
      const { data, error } = await supabase.rpc('get_leaderboard_stats');

      if (!error && data) {
        // Assign rank
        const rankedData = data.map((u, i) => ({ ...u, rank: i + 1 }));
        setUsers(rankedData);
      }
      setLoading(false);
    }
    loadLeaderboard();
  }, []);

  const openBreakdown = async (user) => {
    setSelectedUser(user);
    setBreakdownLoading(true);
    setUserPredictions([]);

    const { data, error } = await supabase
      .from('predictions')
      .select(`
        points,
        matches!inner ( home_team, away_team, status, stage )
      `)
      .eq('user_id', user.id)
      .not('matches.home_score', 'is', null);

    if (!error && data) {
      setUserPredictions(data);
    }
    setBreakdownLoading(false);
  };

  if (loading) return <p className="text-muted">Loading Global Leaderboard...</p>;

  const displayedUsers = users.slice(0, displayLimit);
  const currentUserIndex = users.findIndex(u => u.id === currentUserId);
  const currentUser = currentUserIndex !== -1 ? users[currentUserIndex] : null;
  const isCurrentUserHidden = currentUserIndex >= displayLimit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Trophy size={28} color="var(--accent)" />
        <h2 className="text-primary-gradient">Global Leaderboard</h2>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem 0.75rem', width: '60px' }}>Rank</th>
                <th style={{ padding: '1rem 0.75rem' }}>Player</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Played</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Matched</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Accuracy</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Total Points</th>
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
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>
                      {user.rank === 1 && <Award size={20} color="#fbbf24" style={{ verticalAlign: 'middle' }} />}
                      {user.rank === 2 && <Medal size={20} color="#9ca3af" style={{ verticalAlign: 'middle' }} />}
                      {user.rank === 3 && <Medal size={20} color="#b45309" style={{ verticalAlign: 'middle' }} />}
                      {user.rank > 3 && <span style={{ paddingLeft: '4px' }}>{user.rank}</span>}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>
                      <Link to={`/profile/${user.id}`} style={{ color: user.id === currentUserId ? 'var(--secondary)' : 'inherit', textDecoration: 'none' }}>
                        {user.username} {user.id === currentUserId && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(You)</span>}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {user.finished_predictions}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {user.correct_predictions}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>
                      {user.accuracy_percentage}%
                    </td>
                    <td 
                      style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => openBreakdown(user)}
                      title={`View ${user.username}'s points breakdown`}
                    >
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
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold' }}>
                        <span style={{ paddingLeft: '4px' }}>{currentUser.rank}</span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>
                        <Link to={`/profile/${currentUser.id}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                          {currentUser.username} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(You)</span>
                        </Link>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {currentUser.finished_predictions}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {currentUser.correct_predictions}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {currentUser.accuracy_percentage}%
                      </td>
                      <td 
                        style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => openBreakdown(currentUser)}
                        title={`View your points breakdown`}
                      >
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

      {/* Breakdown Modal Overlay */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            
            <div 
              style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setSelectedUser(null)}
            >
              <X size={20} />
            </div>

            <h3 style={{ marginBottom: '0.25rem', color: 'var(--text-main)', paddingRight: '2rem' }}>
              {selectedUser.username}'s Points
            </h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Accuracy: <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{selectedUser.accuracy_percentage}%</span> ({selectedUser.correct_predictions} matched / {selectedUser.finished_predictions} played)
            </div>
            <div style={{ color: 'var(--secondary)', fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              Total: {selectedUser.total_points} Pts
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {breakdownLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} className="loading-spinner" />
                </div>
              ) : userPredictions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No finished matches found.</p>
              ) : (
                userPredictions.map((pred, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{pred.matches.stage}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pred.matches.home_team} vs {pred.matches.away_team}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: pred.points > 0 ? 'var(--secondary)' : 'var(--text-muted)', fontSize: '1.1rem' }}>
                      +{pred.points || 0}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
