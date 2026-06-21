import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, KeyRound, Copy, Check, UsersRound, Award, Medal, ChevronDown, ChevronRight, Loader2, X, Trash2, ShieldAlert, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const renderPlayerName = (user, currentUserId) => {
  const hasRealName = user.first_name || user.last_name;
  const mainName = hasRealName ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.username;
  const subName = hasRealName ? user.username : null;

  return (
    <Link to={`/profile/${user.id}`} style={{ color: user.id === currentUserId ? 'var(--secondary)' : 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontWeight: 600 }}>
        {mainName}
        {user.id === currentUserId && <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '0.5rem' }}>(You)</span>}
      </span>
      {subName && (
        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'normal', marginTop: '0.1rem' }}>@{subName}</span>
      )}
    </Link>
  );
};

export default function Leagues({ session }) {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Join State
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionError, setActionError] = useState(null);
  
  // Info Modal State
  const [infoModal, setInfoModal] = useState(null);

  useEffect(() => {
    loadMyLeagues();
  }, [session]);

  const loadMyLeagues = async () => {
    setLoading(true);
    // Get all leagues where the user is a member
    const { data, error } = await supabase
      .from('league_members')
      .select(`
        leagues ( id, name, invite_code, owner_id, created_at )
      `)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error fetching leagues:', error);
    } else if (data) {
      // Extract the league objects from the join
      setLeagues(data.map(d => d.leagues).filter(Boolean));
    }
    setLoading(false);
  };

  const handleCreateLeague = async (e) => {
    e.preventDefault();
    setActionError(null);
    if (!leagueName.trim()) return;

    // 1. Create the league
    const { data: newLeague, error: createError } = await supabase
      .from('leagues')
      .insert([{ name: leagueName.trim(), owner_id: session.user.id }])
      .select()
      .single();

    if (createError) {
      setActionError(createError.message);
      return;
    }

    // 2. Add creator as a member
    const { error: memberError } = await supabase
      .from('league_members')
      .insert([{ league_id: newLeague.id, user_id: session.user.id }]);

    if (memberError) {
      setActionError(memberError.message);
      return;
    }

    setLeagueName('');
    setIsCreating(false);
    loadMyLeagues();
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    setActionError(null);
    if (!inviteCode.trim()) return;

    // 1. Find the league by code
    const { data: league, error: findError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('invite_code', inviteCode.trim())
      .single();

    if (findError || !league) {
      setActionError("Invalid invite code. Please check and try again.");
      return;
    }

    // 2. Add user as member
    const { error: joinError } = await supabase
      .from('league_members')
      .insert([{ league_id: league.id, user_id: session.user.id }]);

    if (joinError) {
      if (joinError.code === '23505') { // Unique violation
        setActionError("You are already in this league.");
      } else {
        setActionError(joinError.message);
      }
      return;
    }

    setInviteCode('');
    setIsJoining(false);
    loadMyLeagues();
  };

  if (loading) return <p className="text-muted">Loading your leagues...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={28} color="var(--accent)" />
          <h2 className="text-primary-gradient" style={{ margin: 0 }}>Private Leagues</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${isJoining ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setIsJoining(true); setIsCreating(false); setActionError(null); }}
          >
            <KeyRound size={18} /> Join with Code
          </button>
          <button 
            className={`btn ${isCreating ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setIsCreating(true); setIsJoining(false); setActionError(null); }}
          >
            <Plus size={18} /> Create League
          </button>
        </div>
      </div>

      {/* Action Forms */}
      {(isCreating || isJoining) && (
        <div className="glass-panel" style={{ position: 'relative' }}>
          <button 
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => { setIsCreating(false); setIsJoining(false); }}
          >
            <X size={20} />
          </button>

          <h3 style={{ marginBottom: '1rem' }}>
            {isCreating ? 'Create a New League' : 'Join an Existing League'}
          </h3>
          
          {actionError && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
              {actionError}
            </div>
          )}

          <form onSubmit={isCreating ? handleCreateLeague : handleJoinLeague} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isCreating ? 'League Name' : 'Invite Code'}
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder={isCreating ? "e.g. The Office Pool" : "e.g. a1b2c3d4"}
                value={isCreating ? leagueName : inviteCode}
                onChange={(e) => isCreating ? setLeagueName(e.target.value) : setInviteCode(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {isCreating ? 'Create' : 'Join'}
            </button>
          </form>
        </div>
      )}

      {/* Leagues List */}
      {leagues.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <UsersRound size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No Leagues Yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Create a private league to compete directly with your friends, or join one if you have an invite code.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {leagues.map(league => (
            <LeagueLeaderboard 
              key={league.id} 
              league={league} 
              currentUserId={session.user.id} 
              onLeave={loadMyLeagues}
              setInfoModal={setInfoModal}
            />
          ))}
        </div>
      )}

      {/* Info Modal Overlay */}
      {infoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setInfoModal(null)}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={24} /> {infoModal}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
              {infoModal === 'Played' && (
                <p><strong>Played</strong> represents the total number of finished matches you have predicted. Matches that are still upcoming or in progress do not count toward this total.</p>
              )}
              {infoModal === 'Matched' && (
                <p><strong>Matched</strong> represents the number of matches where you earned at least 1 point. This means you successfully guessed the correct winner or a draw.</p>
              )}
              {infoModal === 'Accuracy' && (
                <>
                  <p><strong>Accuracy</strong> is calculated as your total points divided by the maximum possible points you could have earned from the matches you played.</p>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--secondary)' }}>Example</h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>If you played 10 matches, the maximum points you could earn is 30 (3 pts per match). If you earned 15 points, your accuracy is <strong>50%</strong> (15 / 30).</p>
                  </div>
                </>
              )}
              {infoModal === 'Total Points' && (
                <>
                  <p><strong>Total Points</strong> are the sum of points you've earned from all your predictions.</p>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--secondary)' }}>Scoring Rules</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Exact Score (3 pts):</strong> You predicted 2-1, and the final score was 2-1.</li>
                      <li style={{ marginBottom: '0.5rem' }}><strong>Correct Difference & Winner (2 pts):</strong> You predicted 2-0 (+2), and the final score was 3-1 (+2).</li>
                      <li><strong>Correct Winner (1 pt):</strong> You predicted 1-0, and the final score was 3-0.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeagueLeaderboard({ league, currentUserId, onLeave, setInfoModal }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Breakdown Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [userPredictions, setUserPredictions] = useState([]);

  // Leave League State
  const [isLeaving, setIsLeaving] = useState(false);

  const isOwner = league.owner_id === currentUserId;

  useEffect(() => {
    async function loadMembers() {
      const { data, error } = await supabase.rpc('get_league_leaderboard_stats', { target_league_id: league.id });

      if (!error && data) {
        // Assign rank
        const rankedData = data.map((u, i) => ({ ...u, rank: i + 1 }));
        setMembers(rankedData);
      }
      setLoading(false);
    }
    
    if (expanded) {
      loadMembers();
    }
  }, [expanded, league.id]);

  const copyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async (e) => {
    e.stopPropagation();
    if (!window.confirm(isOwner 
        ? "You are the owner. Leaving will DELETE the league for everyone. Are you sure?" 
        : "Are you sure you want to leave this league?")) return;
    
    setIsLeaving(true);
    
    if (isOwner) {
      await supabase.from('leagues').delete().eq('id', league.id);
    } else {
      await supabase.from('league_members').delete()
        .eq('league_id', league.id)
        .eq('user_id', currentUserId);
    }
    
    onLeave(); // trigger parent refresh
  };

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

  const currentUserIndex = members.findIndex(u => u.id === currentUserId);
  const currentUser = currentUserIndex !== -1 ? members[currentUserIndex] : null;

  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Accordion Header */}
      <div 
        style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,0.05)' : 'transparent',
          transition: 'background 0.2s',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {expanded ? <ChevronDown size={24} color="var(--accent)"/> : <ChevronRight size={24} color="var(--text-muted)"/>}
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: expanded ? 'var(--text-main)' : 'var(--text-muted)' }}>
            {league.name}
            {isOwner && <span style={{ fontSize: '0.75rem', background: 'var(--secondary)', color: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', marginLeft: '0.75rem', fontWeight: 'bold' }}>OWNER</span>}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Invite Code Badge */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'rgba(0,0,0,0.3)', 
              padding: '0.4rem 0.75rem', 
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent accordion toggle when interacting with badge
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>{league.invite_code}</span>
            <button 
              onClick={copyCode}
              style={{ background: 'none', border: 'none', color: copied ? '#10b981' : 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}
              title="Copy Invite Code"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          
          <button 
            onClick={handleLeave}
            disabled={isLeaving}
            style={{ background: 'none', border: 'none', color: isOwner ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
            title={isOwner ? "Delete League" : "Leave League"}
          >
            {isOwner ? <ShieldAlert size={18} /> : <Trash2 size={18} />}
          </button>
        </div>
      </div>

      {/* Accordion Content (Leaderboard) */}
      {expanded && (
        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Loading rankings...</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '1rem 0.75rem', width: '60px' }}>Rank</th>
                    <th style={{ padding: '1rem 0.75rem' }}>Player</th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        Played <Info size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setInfoModal('Played')} />
                      </div>
                    </th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        Matched <Info size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setInfoModal('Matched')} />
                      </div>
                    </th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        Accuracy <Info size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setInfoModal('Accuracy')} />
                      </div>
                    </th>
                    <th style={{ padding: '1rem 0.75rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        Total Points <Info size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setInfoModal('Total Points')} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nobody is here yet! Share the invite code to get started.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Top 5 Displayed */}
                      {members.slice(0, 5).map((user) => (
                        <tr 
                          key={user.id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            backgroundColor: user.id === currentUserId ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                            borderLeft: user.id === currentUserId ? '4px solid var(--secondary)' : '4px solid transparent'
                          }}
                        >
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold', verticalAlign: 'middle' }}>
                            {user.rank === 1 && <Award size={20} color="#fbbf24" style={{ verticalAlign: 'middle' }} />}
                            {user.rank === 2 && <Medal size={20} color="#9ca3af" style={{ verticalAlign: 'middle' }} />}
                            {user.rank === 3 && <Medal size={20} color="#b45309" style={{ verticalAlign: 'middle' }} />}
                            {user.rank > 3 && <span style={{ paddingLeft: '4px' }}>{user.rank}</span>}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', verticalAlign: 'middle' }}>
                            {renderPlayerName(user, currentUserId)}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                            {user.finished_predictions}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                            {user.correct_predictions}
                          </td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', verticalAlign: 'middle' }}>
                            {user.accuracy_percentage}%
                          </td>
                          <td 
                            style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', verticalAlign: 'middle' }}
                            onClick={() => openBreakdown(user)}
                            title={`View ${user.username}'s points breakdown`}
                          >
                            {user.total_points}
                          </td>
                        </tr>
                      ))}

                      {/* Current User Row (if they are below rank 5) */}
                      {currentUserIndex >= 5 && currentUser && (
                        <>
                          <tr style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                            <td colSpan="6" style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '2px' }}>
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
                            <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold', verticalAlign: 'middle' }}>
                              <span style={{ paddingLeft: '4px' }}>{currentUser.rank}</span>
                            </td>
                            <td style={{ padding: '1rem 0.75rem', verticalAlign: 'middle' }}>
                              {renderPlayerName(currentUser, currentUserId)}
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                              {currentUser.finished_predictions}
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', verticalAlign: 'middle' }}>
                              {currentUser.correct_predictions}
                            </td>
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', verticalAlign: 'middle' }}>
                              {currentUser.accuracy_percentage}%
                            </td>
                            <td 
                              style={{ padding: '1rem 0.75rem', textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', verticalAlign: 'middle' }}
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
          )}
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
              {selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() : selectedUser.username}'s Points
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
