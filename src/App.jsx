import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Trophy, LogOut, Shield, Users, Medal, Settings as SettingsIcon, Menu, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      // Fix for Magic Links and HashRouter: Clear the access token from the URL
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        window.location.hash = '/';
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const closeMenu = () => setIsMobileMenuOpen(false);

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
          <Link to="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'inherit' }}>
            <Trophy color="var(--accent)" size={32} />
            <h1 className="text-primary-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>FIFA Predictor</h1>
          </Link>
          
          {session && (
            <>
              {/* Desktop Nav */}
              <div className="nav-links desktop-nav" style={{ gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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

              {/* Mobile Menu Toggle Button */}
              <button 
                className="mobile-menu-btn" 
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu size={28} />
              </button>

              {/* Mobile Full Screen Overlay */}
              <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
                <button className="mobile-menu-close" onClick={closeMenu}>
                  <X size={32} />
                </button>
                <Link to="/" className="btn btn-outline" onClick={closeMenu} style={{ border: 'none', gap: '0.5rem' }}><Trophy size={20}/> Matches</Link>
                <Link to="/leaderboard" className="btn btn-outline" onClick={closeMenu} style={{ border: 'none', gap: '0.5rem' }}><Medal size={20}/> Global Leaderboard</Link>
                <Link to="/leagues" className="btn btn-outline" onClick={closeMenu} style={{ border: 'none', gap: '0.5rem' }}><Users size={20}/> Private Leagues</Link>
                <Link to="/settings" className="btn btn-outline" onClick={closeMenu} style={{ border: 'none', gap: '0.5rem' }}><SettingsIcon size={20}/> Settings</Link>
                <Link to="/admin" className="btn btn-outline" onClick={closeMenu} style={{ border: 'none', gap: '0.5rem' }}><Shield size={20}/> Admin</Link>
                <button 
                  className="btn btn-outline"
                  style={{ gap: '0.5rem', marginTop: '1rem', border: '1px solid var(--border-light)' }}
                  onClick={() => { closeMenu(); supabase.auth.signOut(); }}
                >
                  <LogOut size={20} /> Sign Out
                </button>
              </div>
            </>
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
  const handleOAuthLogin = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.href
      }
    })
    if (error) console.error('Error logging in:', error.message)
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button type="button" className="btn btn-outline" style={{ padding: '0.75rem 1rem', fontSize: '1rem', width: '100%' }} onClick={() => handleOAuthLogin('google')}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" stroke="none"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" stroke="none"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" stroke="none"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" stroke="none"/></svg>
            Continue with Google
          </button>
          <button type="button" className="btn btn-outline" style={{ padding: '0.75rem 1rem', fontSize: '1rem', width: '100%' }} onClick={() => handleOAuthLogin('github')}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.35 6.5-1.5 6.5-7.1a5.25 5.25 0 0 0-1.5-3.8 4.33 4.33 0 0 0 0-3.8s-1.18-.38-3.9 1.4a13.38 13.38 0 0 0-7 0c-2.72-1.78-3.9-1.4-3.9-1.4a4.33 4.33 0 0 0 0 3.8 5.25 5.25 0 0 0-1.5 3.8c0 5.6 3.3 6.75 6.5 7.1a4.8 4.8 0 0 0-1 3.03v4"/><path d="M9 20c-3 1-5-1-5-3"/></svg>
            Continue with GitHub
          </button>
        </div>
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
