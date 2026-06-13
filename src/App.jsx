import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Trophy, LogOut, Shield, Users, Medal, Settings as SettingsIcon } from 'lucide-react'
import { supabase } from './lib/supabase'
import MatchList from './components/MatchList'
import AdminDashboard from './components/AdminDashboard'
import Leaderboard from './components/Leaderboard'
import Leagues from './components/Leagues'
import UserProfile from './components/UserProfile'
import Settings from './components/Settings'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 className="text-gradient">Loading FIFA Predictor...</h2>
      </div>
    )
  }

  return (
    <Router>
      <div className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'inherit' }}>
            <Trophy color="var(--accent)" size={32} />
            <h1 className="text-primary-gradient" style={{ margin: 0 }}>FIFA Predictor 2026</h1>
          </Link>
          
          {session && (
            <div className="nav-links" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="btn btn-outline" style={{ border: 'none' }}>Matches</Link>
              <Link to="/leaderboard" className="btn btn-outline" style={{ border: 'none', gap: '0.25rem' }}><Medal size={18}/> Global</Link>
              <Link to="/leagues" className="btn btn-outline" style={{ border: 'none', gap: '0.25rem' }}><Users size={18}/> Leagues</Link>
              <Link to="/settings" className="btn btn-outline" style={{ border: 'none', gap: '0.25rem' }}>
                <SettingsIcon size={18} /> Settings
              </Link>
              <Link to="/admin" className="btn btn-outline" style={{ border: 'none', gap: '0.25rem' }}>
                <Shield size={18} /> Admin
              </Link>
              <button 
                className="btn btn-outline"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </header>

        <Routes>
          <Route 
            path="/" 
            element={session ? <Dashboard session={session} /> : <Landing />} 
          />
          <Route 
            path="/leaderboard" 
            element={session ? <Leaderboard /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/leagues" 
            element={session ? <Leagues session={session} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/admin" 
            element={session ? <AdminDashboard session={session} /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/profile/:userId" 
            element={session ? <UserProfile /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/settings" 
            element={session ? <Settings session={session} /> : <Navigate to="/" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

function Landing() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleOAuthLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
    })
    if (error) console.error('Error logging in:', error.message)
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(error.message);
    } else {
      setEmailSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }} className="text-gradient">
        Predict the Future of Football
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        Join the ultimate FIFA World Cup 2026™ prediction league. Compete globally or create private leagues with your friends.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
        {emailSent ? (
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', borderRadius: '8px', color: 'var(--secondary)' }}>
            Magic link sent! Check your email to log in.
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-outline" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}



        <button className="btn btn-outline" style={{ padding: '0.75rem 1rem', fontSize: '1rem' }} onClick={() => handleOAuthLogin('github')}>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.35 6.5-1.5 6.5-7.1a5.25 5.25 0 0 0-1.5-3.8 4.33 4.33 0 0 0 0-3.8s-1.18-.38-3.9 1.4a13.38 13.38 0 0 0-7 0c-2.72-1.78-3.9-1.4-3.9-1.4a4.33 4.33 0 0 0 0 3.8 5.25 5.25 0 0 0-1.5 3.8c0 5.6 3.3 6.75 6.5 7.1a4.8 4.8 0 0 0-1 3.03v4"/><path d="M9 20c-3 1-5-1-5-3"/></svg>
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}

function Dashboard({ session }) {
  const username = session.user.user_metadata?.user_name || session.user.email

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Welcome back, <span className="text-primary-gradient">{username}</span>!</h2>
        <p style={{ color: 'var(--text-muted)' }}>You are now ready to make your predictions.</p>
      </div>
      
      <MatchList session={session} />
    </div>
  )
}

export default App
