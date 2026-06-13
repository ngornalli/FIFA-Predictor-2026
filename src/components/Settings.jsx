import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, User } from 'lucide-react';

export default function Settings({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    phone: '',
    address: '',
    hobbies: '',
    favorite_team: '',
    favorite_player: ''
  });

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, dob, phone, address, hobbies, favorite_team, favorite_player')
        .eq('id', session.user.id)
        .single();

      if (data && !error) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          dob: data.dob || '',
          phone: data.phone || '',
          address: data.address || '',
          hobbies: data.hobbies || '',
          favorite_team: data.favorite_team || '',
          favorite_player: data.favorite_player || ''
        });
      }
      setLoading(false);
    }
    getProfile();
  }, [session]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('users')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        dob: formData.dob || null, // Handle empty date string
        phone: formData.phone,
        address: formData.address,
        hobbies: formData.hobbies,
        favorite_team: formData.favorite_team,
        favorite_player: formData.favorite_player
      })
      .eq('id', session.user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted">Loading profile settings...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <SettingsIcon size={28} color="var(--accent)" />
        <h2 className="text-primary-gradient">Profile Settings</h2>
      </div>

      {message && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--secondary)' : '#ef4444'}`,
          color: message.type === 'success' ? 'var(--secondary)' : '#ef4444'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>First Name</label>
            <input type="text" name="first_name" className="input-field" value={formData.first_name} onChange={handleChange} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Last Name</label>
            <input type="text" name="last_name" className="input-field" value={formData.last_name} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Date of Birth <span style={{fontSize: '0.8rem'}}>(Private)</span></label>
            <input type="date" name="dob" className="input-field" value={formData.dob} onChange={handleChange} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Phone Number <span style={{fontSize: '0.8rem'}}>(Private)</span></label>
            <input type="tel" name="phone" className="input-field" value={formData.phone} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Address <span style={{fontSize: '0.8rem'}}>(Private)</span></label>
          <textarea name="address" className="input-field" rows="3" value={formData.address} onChange={handleChange}></textarea>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1rem 0' }} />
        <h3 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} /> Public Profile Info
        </h3>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Favorite Team</label>
            <input type="text" name="favorite_team" className="input-field" placeholder="e.g. Argentina" value={formData.favorite_team} onChange={handleChange} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Favorite Player</label>
            <input type="text" name="favorite_player" className="input-field" placeholder="e.g. Lionel Messi" value={formData.favorite_player} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Hobbies</label>
          <textarea name="hobbies" className="input-field" rows="2" placeholder="Playing football, watching sports..." value={formData.hobbies} onChange={handleChange}></textarea>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem', marginTop: '1rem' }} disabled={saving}>
          {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
