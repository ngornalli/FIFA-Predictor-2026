import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Plus, Hash, LogIn, ChevronLeft, Award, Medal } from 'lucide-react';

export default function Leagues({ session }) {
  const [leagues, setLeagues] = useState([]);
  const [activeLeague, setActiveLeague] = useState(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeagues = async () => {
    setLoading(true);
    // Fetch leagues the user is a member of
    const { data, error } = await supabase
      .from('league_members')
      .select(`
        league_id,
        leagues ( id, name, invite_code, owner_id )
      `)
      .eq('user_id', session.user.id);

    if (!error && data) {
      setLeagues(data.map(d => d.leagues));
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
      .insert({ name: newLeagueName, owner_id: session.user.id })
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
          <form onSubmit={handleCreateLeague} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="League Name" 
              value={newLeagueName}
              onChange={e => setNewLeagueName(e.target.value)}
              disabled={actionLoading}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>Create</button>
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
            <button type="submit" className="btn btn-outline" disabled={actionLoading}>Join</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LeagueLeaderboard({ league, onBack }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setMembers(extractedUsers);
      }
      setLoading(false);
    }
    loadMembers();
  }, [league.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              {members.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No members yet.
                  </td>
                </tr>
              ) : (
                members.map((user, index) => (
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
      )}
    </div>
  );
}
