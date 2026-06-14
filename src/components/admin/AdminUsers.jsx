import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Shield, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pointsFrom, setPointsFrom] = useState('');
  const [pointsTo, setPointsTo] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total_points', direction: 'desc' });

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('total_points', { ascending: false });
        
      if (!error && data) {
        setUsers(data);
      }
      setLoading(false);
    }
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 className="loading-spinner" size={32} />
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const searchMatch = (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const fromMatch = pointsFrom === '' || user.total_points >= parseInt(pointsFrom, 10);
    const toMatch = pointsTo === '' || user.total_points <= parseInt(pointsTo, 10);
    return searchMatch && fromMatch && toMatch;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>User Management</h3>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <input 
          type="text" 
          placeholder="Search username or email..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="input-field" 
          style={{ flex: 2, minWidth: '200px' }} 
        />
        <input 
          type="number" 
          placeholder="Min Points" 
          value={pointsFrom} 
          onChange={(e) => setPointsFrom(e.target.value)} 
          className="input-field" 
          style={{ flex: 1, minWidth: '100px' }} 
        />
        <input 
          type="number" 
          placeholder="Max Points" 
          value={pointsTo} 
          onChange={(e) => setPointsTo(e.target.value)} 
          className="input-field" 
          style={{ flex: 1, minWidth: '100px' }} 
        />
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th onClick={() => requestSort('username')} style={{ padding: '1rem 0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  Username {sortConfig.key === 'username' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('email')} style={{ padding: '1rem 0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  Email {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('total_points')} style={{ padding: '1rem 0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  Total Points {sortConfig.key === 'total_points' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('created_at')} style={{ padding: '1rem 0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  Joined Date {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user.is_admin && <Shield size={14} color="#ef4444" title="Admin" />}
                      {user.username}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{user.email || 'N/A'}</td>
                  <td style={{ padding: '1rem 0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{user.total_points}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                    <Link to={`/profile/${user.id}`} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                      <Eye size={16} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
