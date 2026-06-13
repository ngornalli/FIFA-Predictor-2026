import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, ChevronLeft, CheckCircle, XCircle } from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('username, total_points, created_at, first_name, last_name, hobbies, favorite_team, favorite_player')
        .eq('id', userId)
        .single();
        
      setProfile(userData);

      // Fetch past finished predictions
      const { data: predsData } = await supabase
        .from('predictions')
        .select(`
          home_score_pred,
          away_score_pred,
          points_awarded,
          matches!inner ( home_team, away_team, home_score, away_score, status, stage )
        `)
        .eq('user_id', userId)
        .eq('matches.status', 'finished')
        .order('created_at', { ascending: false });

      setPredictions(predsData || []);
      setLoading(false);
    }
    loadProfile();
  }, [userId]);

  if (loading) return <p className="text-muted">Loading profile...</p>;
  if (!profile) return <p style={{ color: '#ef4444' }}>User not found.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button 
        className="btn btn-outline" 
        onClick={() => window.history.back()}
        style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }}
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem', padding: '2rem' }}>
        <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '50%' }}>
          <User size={64} color="var(--primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            {profile.username}
          </h2>
          {(profile.first_name || profile.last_name) && (
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              {profile.first_name} {profile.last_name}
            </p>
          )}
          <p className="text-primary-gradient" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {profile.total_points} Points
          </p>
        </div>
        
        <div style={{ flex: 1, minWidth: '250px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
          <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Favorite Team:</strong> {profile.favorite_team || '-'}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Favorite Player:</strong> {profile.favorite_player || '-'}</p>
          <p><strong style={{ color: 'var(--text-muted)' }}>Hobbies:</strong> {profile.hobbies || '-'}</p>
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>Prediction History (Finished Matches)</h3>
        {predictions.length === 0 ? (
          <p className="text-muted glass-panel">No finished predictions yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {predictions.map((p, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{p.matches.stage}</span>
                  <strong style={{ color: p.points_awarded > 0 ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    +{p.points_awarded || 0} Pts
                  </strong>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {p.matches.home_team} vs {p.matches.away_team}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <span>Predicted: {p.home_score_pred} - {p.away_score_pred}</span>
                  <span>Actual: {p.matches.home_score} - {p.matches.away_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
