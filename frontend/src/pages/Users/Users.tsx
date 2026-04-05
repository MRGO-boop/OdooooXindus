import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Search, Users as UsersIcon, Shield, User, Globe } from 'lucide-react';

const roleBadge = (r) => r === 'admin' ? 'badge-danger' : r === 'internal' ? 'badge-info' : 'badge-success';
const roleIcon = (r) => r === 'admin' ? Shield : r === 'internal' ? User : Globe;

export default function UsersPage() {
  const { refresh, getUsers, addUser, updateUser, deleteUser } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'internal' });
  const [error, setError] = useState('');

  const users = useMemo(() => {
    const all = getUsers();
    if (!search) return all;
    return all.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'internal' }); setError(''); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setError(''); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email are required');
    if (!editing && !form.password) return setError('Password is required');
    
    if (editing) {
      const updates = { name: form.name, email: form.email, role: form.role };
      if (form.password) updates.password = form.password;
      updateUser(editing.id, updates);
    } else {
      const success = addUser({ name: form.name, email: form.email, password: form.password, role: form.role });
      if (!success) return setError('Email already exists');
    }
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Users & Contacts</h1>
        <div className="page-header-actions">
          <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Create User</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => {
              const RIcon = roleIcon(u.role);
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}><RIcon size={14} style={{ marginRight: 8, opacity: 0.6 }} />{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td><div className="table-actions">
                    <button className="btn-icon" onClick={() => openEdit(u)}><Edit2 size={15} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteUser(u.id)}><Trash2 size={15} /></button>
                  </div></td>
                </tr>
              );
            })}
            {users.length === 0 && <tr><td colSpan={5} className="table-empty">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit User' : 'Create User'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password'}</label><input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep current' : ''} /></div>
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Admin</option><option value="internal">Internal User</option><option value="portal">Portal User</option>
                  </select>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Rule: Only Admin can create Internal Users</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
