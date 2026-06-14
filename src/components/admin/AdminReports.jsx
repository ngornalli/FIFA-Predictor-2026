import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, TrendingUp, Users, Target } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const PIE_COLORS_ACCURACY = ['#10b981', '#3b82f6', '#ef4444']; 
const PIE_COLORS_TRENDS = ['#3b82f6', '#f59e0b', '#8b5cf6'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  
  // States for charts
  const [pointsDist, setPointsDist] = useState([]);
  const [predTrends, setPredTrends] = useState([]);
  const [matchEngage, setMatchEngage] = useState([]);
  const [avgMatchPts, setAvgMatchPts] = useState([]);
  const [exactScores, setExactScores] = useState([]);
  const [leaguePop, setLeaguePop] = useState([]);
  const [predAccuracy, setPredAccuracy] = useState([]);
  const [teamConf, setTeamConf] = useState([]);
  const [goalsPredActual, setGoalsPredActual] = useState([]);
  const [signupsTime, setSignupsTime] = useState([]);
  
  // KPI Stats
  const [userStats, setUserStats] = useState({ avg: 0, median: 0, max: 0 });

  useEffect(() => {
    async function loadData() {
      const [usersRes, predsRes, matchesRes, leaguesRes, membersRes] = await Promise.all([
        supabase.from('users').select('created_at, total_points'),
        supabase.from('predictions').select('home_score_pred, away_score_pred, match_id, points'),
        supabase.from('matches').select('id, home_team, away_team, home_score, away_score, status'),
        supabase.from('leagues').select('id, name'),
        supabase.from('league_members').select('league_id')
      ]);

      if (usersRes.data && predsRes.data && matchesRes.data) {
        const users = usersRes.data;
        const preds = predsRes.data;
        const matches = matchesRes.data;
        
        // --- 1. Points Distribution ---
        const bins = { '0-20': 0, '21-50': 0, '51-100': 0, '101-150': 0, '150+': 0 };
        let allPoints = [];
        
        // --- 8. Signups Over Time ---
        const signupDates = {};

        users.forEach(u => {
          const p = u.total_points || 0;
          allPoints.push(p);
          if (p <= 20) bins['0-20']++;
          else if (p <= 50) bins['21-50']++;
          else if (p <= 100) bins['51-100']++;
          else if (p <= 150) bins['101-150']++;
          else bins['150+']++;

          const date = new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          signupDates[date] = (signupDates[date] || 0) + 1;
        });
        setPointsDist(Object.keys(bins).map(k => ({ name: k, users: bins[k] })));

        // --- 6. User Stats (KPI) ---
        allPoints.sort((a,b) => a - b);
        const max = allPoints.length ? allPoints[allPoints.length - 1] : 0;
        const avg = allPoints.length ? Math.round(allPoints.reduce((a,b)=>a+b, 0) / allPoints.length) : 0;
        const median = allPoints.length ? allPoints[Math.floor(allPoints.length / 2)] : 0;
        setUserStats({ avg, median, max });

        let cumulative = 0;
        const signupsArr = Object.keys(signupDates).sort((a,b) => new Date(a) - new Date(b)).map(date => {
          cumulative += signupDates[date];
          return { date, users: cumulative };
        });
        setSignupsTime(signupsArr);

        const matchMap = {};
        matches.forEach(m => matchMap[m.id] = m);

        let homeWins = 0, awayWins = 0, draws = 0;
        const matchCounts = {};
        const scoreCounts = {};
        let exactCount = 0, partialCount = 0, wrongCount = 0;
        const teamWins = {};
        
        const matchPointsTotal = {};
        const matchPredsTotal = {};
        const matchGoalsPred = {};

        preds.forEach(p => {
          const m = matchMap[p.match_id];
          if (!m) return;
          
          const matchName = `${m.home_team.substring(0,3)}v${m.away_team.substring(0,3)}`;

          // --- 2. Global Trends ---
          if (p.home_score_pred > p.away_score_pred) homeWins++;
          else if (p.home_score_pred < p.away_score_pred) awayWins++;
          else draws++;
          
          // --- 3. Match Engagement ---
          matchCounts[matchName] = (matchCounts[matchName] || 0) + 1;

          // --- 5. Most Predicted Exact Scores ---
          const scoreKey = `${p.home_score_pred}-${p.away_score_pred}`;
          scoreCounts[scoreKey] = (scoreCounts[scoreKey] || 0) + 1;

          // --- 4. Accuracy Ratio ---
          if (p.points >= 25) exactCount++; 
          else if (p.points >= 10) partialCount++;
          else if (p.points !== null) wrongCount++;

          // --- 5. Team Confidence ---
          if (p.home_score_pred > p.away_score_pred) {
            teamWins[m.home_team] = (teamWins[m.home_team] || 0) + 1;
          } else if (p.away_score_pred > p.home_score_pred) {
            teamWins[m.away_team] = (teamWins[m.away_team] || 0) + 1;
          }

          if (m.home_score !== null) {
            matchPointsTotal[matchName] = (matchPointsTotal[matchName] || 0) + (p.points || 0);
            matchPredsTotal[matchName] = (matchPredsTotal[matchName] || 0) + 1;
            matchGoalsPred[matchName] = (matchGoalsPred[matchName] || 0) + p.home_score_pred + p.away_score_pred;
          }
        });

        setPredTrends([
          { name: 'Home Wins', value: homeWins },
          { name: 'Away Wins', value: awayWins },
          { name: 'Draws', value: draws }
        ]);

        setMatchEngage(Object.keys(matchCounts).map(k => ({ name: k, predictions: matchCounts[k] })).sort((a,b)=>b.predictions-a.predictions).slice(0, 7));
        setExactScores(Object.keys(scoreCounts).map(k => ({ score: k, count: scoreCounts[k] })).sort((a,b)=>b.count-a.count).slice(0, 7));
        
        setPredAccuracy([
          { name: 'Exact Score', value: exactCount },
          { name: 'Correct Outcome', value: partialCount },
          { name: 'Wrong Outcome', value: wrongCount }
        ]);

        setTeamConf(Object.keys(teamWins).map(k => ({ team: k, picks: teamWins[k] })).sort((a,b)=>b.picks-a.picks).slice(0, 7));

        const avgPtsArr = Object.keys(matchPointsTotal).map(k => ({
          name: k,
          avgPoints: Math.round(matchPointsTotal[k] / matchPredsTotal[k])
        }));
        setAvgMatchPts(avgPtsArr);

        const goalsArr = Object.keys(matchGoalsPred).map(k => {
          const matchObj = matches.find(m => `${m.home_team.substring(0,3)}v${m.away_team.substring(0,3)}` === k);
          return {
            name: k,
            Predicted: parseFloat((matchGoalsPred[k] / matchPredsTotal[k]).toFixed(1)),
            Actual: (matchObj.home_score || 0) + (matchObj.away_score || 0)
          };
        });
        setGoalsPredActual(goalsArr);
      }

      // --- 6. League Popularity ---
      if (leaguesRes.data && membersRes.data) {
        const counts = {};
        membersRes.data.forEach(m => counts[m.league_id] = (counts[m.league_id] || 0) + 1);
        const lPop = leaguesRes.data.map(l => ({
          name: l.name,
          members: counts[l.id] || 0
        })).sort((a,b)=>b.members-a.members).slice(0, 5);
        setLeaguePop(lPop);
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

  const tooltipStyle = { backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%' }}><TrendingUp size={24} color="#3b82f6" /></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userStats.avg}</div><div className="text-muted" style={{ fontSize: '0.85rem' }}>Mean Points</div></div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%' }}><Target size={24} color="#10b981" /></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userStats.median}</div><div className="text-muted" style={{ fontSize: '0.85rem' }}>Median Points</div></div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '50%' }}><Users size={24} color="#f59e0b" /></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userStats.max}</div><div className="text-muted" style={{ fontSize: '0.85rem' }}>Highest Score</div></div>
        </div>
      </div>

      {/* Row 1: Area & Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>User Growth Over Time</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={signupsTime} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Points Distribution Bracket</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={pointsDist} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Pies */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', textAlign: 'center' }}>Prediction Accuracy Ratio</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={predAccuracy} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({name})=>name} labelLine={false}>
                  {predAccuracy.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_ACCURACY[index % PIE_COLORS_ACCURACY.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', textAlign: 'center' }}>Win/Draw/Lose Trends</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={predTrends} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({name})=>name} labelLine={false}>
                  {predTrends.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS_TRENDS[index % PIE_COLORS_TRENDS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Horizontal Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Team Confidence (Most Predicted to Win)</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={teamConf} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="team" type="category" stroke="var(--text-muted)" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                <Bar dataKey="picks" fill="#14b8a6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Most Predicted Exact Scores</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={exactScores} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="score" type="category" stroke="var(--text-muted)" width={50} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Complex Bars/Lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Match Engagement (Top 7)</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={matchEngage} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                <Bar dataKey="predictions" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Goals: Predicted vs Actual</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={goalsPredActual} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Predicted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Remaining Line Chart and Leagues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Average Points Earned Per Match</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={avgMatchPts} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="avgPoints" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>League Popularity (Top 5)</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={leaguePop} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={100} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={tooltipStyle} />
                <Bar dataKey="members" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
