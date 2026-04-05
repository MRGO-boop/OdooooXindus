import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Search, RefreshCw, Check, X, Pause, RotateCcw } from 'lucide-react';

export default function Plans() {
  const { refresh, getPlans, addPlan, updatePlan, deletePlan } = useData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', billingPeriod: 'Monthly', minQuantity: 1, startDate: '', endDate: '', autoClose: false, closable: true, pausable: true, renewable: true });

  const plans = useMemo(() => {
    const all = getPlans();
    if (!search) return all;
    return all.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', price: '', billingPeriod: 'Monthly', minQuantity: 1, startDate: '', endDate: '', autoClose: false, closable: true, pausable: true, renewable: true }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const data = { ...form, price: Number(form.price), minQuantity: Number(form.minQuantity) };
    if (editing) updatePlan(editing.id, data); else addPlan(data);
    setShowModal(false);
  };

  const BoolIcon = ({ val }) => val ? <Check size={14} style={{ color: 'var(--success)' }} /> : <X size={14} style={{ color: 'var(--text-muted)' }} />;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Recurring Plans</h1>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Plan</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Price</th>
              <th>Billing</th>
              <th>Min Qty</th>
              <th>Auto-close</th>
              <th>Closable</th>
              <th>Pausable</th>
              <th>Renewable</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}><RefreshCw size={14} style={{ marginRight: 8, opacity: 0.5 }} />{p.name}</td>
                <td>{formatCurrency(p.price)}</td>
                <td><span className="badge badge-info">{p.billingPeriod}</span></td>
                <td>{p.minQuantity}</td>
                <td><BoolIcon val={p.autoClose} /></td>
                <td><BoolIcon val={p.closable} /></td>
                <td><BoolIcon val={p.pausable} /></td>
                <td><BoolIcon val={p.renewable} /></td>
                {isAdmin && (
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" onClick={() => openEdit(p)}><Edit2 size={15} /></button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deletePlan(p.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={9} className="table-empty">No plans found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Plan' : 'New Plan'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Plan Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price ($)</label>
                    <input type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Billing Period</label>
                    <select className="form-select" value={form.billingPeriod} onChange={e => setForm({ ...form, billingPeriod: e.target.value })}>
                      <option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Quantity</label>
                  <input type="number" className="form-input" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                  {['autoClose', 'closable', 'pausable', 'renewable'].map(key => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                  ))}
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
