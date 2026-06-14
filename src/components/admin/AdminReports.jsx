import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [pointsData, setPointsData] = useState([]);
  const [predictionOutcomeData, setPredictionOutcomeData] = useState([]);
  const [matchEngagementData, setMatchEngagementData] = useState([]);

  useEffect(() => {
    async function loadData() {
      const [usersRes, predictionsRes, matchesRes] = await Promise.all([
        supabase.from('users').select('total_points'),
        supabase.from('predictions').select('home_score_pred, away_score_pred, match_id'),
        supabase.from('matches').select('id, home_team, away_team')
      ]);

      if (usersRes.data) {
        // Points Distribution
        const bins = { '0-20': 0, '21-50': 0, '51-100': 0, '101-150': 0, '150+': 0 };
        usersRes.data.forEach(u => {
          const p = u.total_points || 0;
          if (p <= 20) bins['0-20']++;
          else if (p <= 50) bins['21-50']++;
          else if (p <= 100) bins['51-100']++;
          else if (p <= 150) bins['101-150']++;
          else bins['150+']++;
        });
        setPointsData(Object.keys(bins).map(k => ({ name: k, users: bins[k] })));
      }

      if (predictionsRes.data && matchesRes.data) {
        // Prediction Trends (Pie Chart)
        let homeWins = 0, awayWins = 0, draws = 0;
        
        // Match Engagement (Bar Chart)
        const matchCounts = {};
        
        predictionsRes.data.forEach(p => {
          // Calculate outcomes
          if (p.home_score_pred > p.away_score_pred) homeWins++;
          else if (p.home_score_pred < p.away_score_pred) awayWins++;
          else draws++;
          
          // Calculate engagement
          matchCounts[p.match_id] = (matchCounts[p.match_id] || 0) + 1;
        });

        setPredictionOutcomeData([
          { name: 'Home Wins', value: homeWins },
          { name: 'Away Wins', value: awayWins },
          { name: 'Draws', value: draws }
        ]);

        // Map engagement data to match names
        const engagement = matchesRes.data.map(m => ({
          name: `${m.home_team.substring(0,3)}v${m.away_team.substring(0,3)}`,
          predictions: matchCounts[m.id] || 0
        })).filter(m => m.predictions > 0).sort((a,b) => b.predictions - a.predictions).slice(0, 10); // Top 10 predicted matches

        setMatchEngagementData(engagement);
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 className="loading-spinner" size={32} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Points Distribution</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={pointsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="users" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Global Prediction Trends</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={predictionOutcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {predictionOutcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Top 10 Predicted Matches</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={matchEngagementData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="predictions" fill="var(--secondary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
