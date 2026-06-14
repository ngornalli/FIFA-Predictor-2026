import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Plus, Hash, LogIn, ChevronLeft, Award, Medal, ChevronDown, X, Loader2 } from 'lucide-react';

export default function Leagues({ session }) {
  const [leagues, setLeagues] = useState([]);
  const [publicLeagues, setPublicLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newLeagueName, setNewLeagueName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeagues = async () => {
    setLoading(true);
    // Fetch leagues the user is a member of
    const { data, error } = await supabase
      .from('league_members')
      .select(`
        league_id,
        leagues ( id, name, invite_code, owner_id, is_public )
      `)
      .eq('user_id', session.user.id);

    let myLeagueIds = [];
    if (!error && data) {
      const myLeagues = data.map(d => d.leagues).filter(Boolean);
      setLeagues(myLeagues);
      myLeagueIds = myLeagues.map(l => l.id);
    }

    // Fetch all public leagues
    const { data: pubData, error: pubError } = await supabase
      .from('leagues')
      .select('id, name, owner_id, invite_code, is_public')
      .eq('is_public', true);

    if (!pubError && pubData) {
      // Filter out leagues the user is already in
      setPublicLeagues(pubData.filter(l => !myLeagueIds.includes(l.id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeagues();
  }, [session]);

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    setActionLoading(true);

    const { data, error } = await supabase
      .from('leagues')
      .insert({ name: newLeagueName, owner_id: session.user.id, is_public: isPublic })
      .select()
      .single();

    if (error) {
      alert('Error creating league: ' + error.message);
    } else {
      // Auto join the league
      await supabase.from('league_members').insert({ league_id: data.id, user_id: session.user.id });
      setNewLeagueName('');
      fetchLeagues();
    }
    setActionLoading(false);
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);

    // Find league by code
    const { data: leagueData, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('invite_code', joinCode.trim())
      .single();

    if (leagueError || !leagueData) {
      alert('Invalid invite code');
      setActionLoading(false);
      return;
    }

    // Join it
    const { error: joinError } = await supabase
      .from('league_members')
      .insert({ league_id: leagueData.id, user_id: session.user.id });

    if (joinError) {
      alert('You are already in this league or an error occurred.');
    } else {
      setJoinCode('');
      fetchLeagues();
    }
    setActionLoading(false);
  };

  const handleJoinPublicLeague = async (leagueId) => {
    setActionLoading(true);
    const { error: joinError } = await supabase
      .from('league_members')
      .insert({ league_id: leagueId, user_id: session.user.id });

    if (joinError) {
      alert('Error joining public league.');
    } else {
      fetchLeagues();
    }
    setActionLoading(false);
  };

  if (activeLeague) {
    return <LeagueLeaderboard league={activeLeague} onBack={() => setActiveLeague(null)} session={session} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Users size={28} color="var(--accent)" />
        <h2 className="text-primary-gradient">Private Leagues</h2>
      </div>

      {loading ? (
        <p className="text-muted">Loading your leagues...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {leagues.map(league => (
            <div 
              key={league.id} 
              className="glass-panel" 
              style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem' }}
              onClick={() => setActiveLeague(league)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{league.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hash size={14} /> Invite Code: <strong style={{ color: 'var(--text-main)' }}>{league.invite_code}</strong>
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Create League Form */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Create a League
          </h3>
          <form onSubmit={handleCreateLeague} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="League Name" 
                value={newLeagueName}
                onChange={e => setNewLeagueName(e.target.value)}
                disabled={actionLoading}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>Create</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
                disabled={actionLoading}
              />
              Make this league Public (anyone can join)
            </label>
          </form>
        </div>

        {/* Join League Form */}
        <div className="glass-panel" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogIn size={20} /> Join a League
          </h3>
          <form onSubmit={handleJoinLeague} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Invite Code (e.g. 8a3f9b2)" 
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              disabled={actionLoading}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>Join</button>
          </form>
        </div>
      </div>

      {/* Public Leagues Section */}
      <div style={{ marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Public Leagues</h3>
        {loading ? (
           <p className="text-muted">Loading public leagues...</p>
        ) : publicLeagues.length === 0 ? (
           <p className="text-muted glass-panel">No public leagues available to join right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {publicLeagues.map(league => (
              <div 
                key={league.id} 
                className="glass-panel" 
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}
              >
                <div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{league.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Public League</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleJoinPublicLeague(league.id)}
                  disabled={actionLoading}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Join League
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function LeagueLeaderboard({ league, onBack, session }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayLimit, setDisplayLimit] = useState(10);
  const currentUserId = session?.user?.id;

  // Breakdown Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [userPredictions, setUserPredictions] = useState([]);

  useEffect(() => {
    async function loadMembers() {
      const { data, error } = await supabase
        .from('league_members')
        .select(`
          users ( id, username, total_points )
        `)
        .eq('league_id', league.id);

      if (!error && data) {
        // Extract users and sort
        let extractedUsers = data.map(d => d.users).filter(Boolean);
        extractedUsers.sort((a, b) => b.total_points - a.total_points);
        
        // Assign rank
        const rankedData = extractedUsers.map((u, i) => ({ ...u, rank: i + 1 }));
        setMembers(rankedData);
      }
      setLoading(false);
    }
    loadMembers();
  }, [league.id]);

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

  const displayedMembers = members.slice(0, displayLimit);
  const currentUserIndex = members.findIndex(u => u.id === currentUserId);
  const currentUser = currentUserIndex !== -1 ? members[currentUserIndex] : null;
  const isCurrentUserHidden = currentUserIndex >= displayLimit;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      <button 
        className="btn btn-outline" 
        onClick={onBack}
        style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }}
      >
        <ChevronLeft size={16} /> Back to Leagues
      </button>

      <div style={{ marginBottom: '1rem' }}>
        <h2 className="text-primary-gradient">{league.name}</h2>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          Share this invite code with friends: <strong style={{ color: 'var(--text-main)', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{league.invite_code}</strong>
        </p>
      </div>

      {loading ? (
        <p className="text-muted">Loading leaderboard...</p>
      ) : (
        <>
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem 0.75rem', width: '60px' }}>Rank</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Player</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No members yet.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {displayedMembers.map((user) => (
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
                          <td 
                            style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => openBreakdown(user)}
                            title={`View ${user.username}'s points breakdown`}
                          >
                            {user.total_points}
                          </td>
                        </tr>
                      ))}

                      {/* Sticky Current User Row */}
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

          {members.length > displayLimit && (
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
        </>
      )}
    </div>
  );
}
