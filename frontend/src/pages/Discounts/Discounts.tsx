import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Search, Percent } from 'lucide-react';

export default function Discounts() {
  const { refresh, getDiscounts, addDiscount, updateDiscount, deleteDiscount } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Percentage', value: '', minPurchase: '', minQuantity: 1, startDate: '', endDate: '', limitUsage: '', usedCount: 0, appliesTo: 'Products' });

  const discounts = useMemo(() => {
    const all = getDiscounts();
    if (!search) return all;
    return all.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', type: 'Percentage', value: '', minPurchase: '', minQuantity: 1, startDate: '', endDate: '', limitUsage: '', usedCount: 0, appliesTo: 'Products' }); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); setForm(d); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    const data = { ...form, value: Number(form.value), minPurchase: Number(form.minPurchase), minQuantity: Number(form.minQuantity), limitUsage: Number(form.limitUsage) };
    if (editing) updateDiscount(editing.id, data); else addDiscount(data);
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Discounts</h1>
        <div className="page-header-actions">
          <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Search discounts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Discount</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Applies To</th><th>Usage</th><th>Period</th><th>Actions</th></tr></thead>
          <tbody>
            {discounts.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}><Percent size={14} style={{ marginRight: 8, opacity: 0.5 }} />{d.name}</td>
                <td><span className="badge badge-info">{d.type}</span></td>
                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{d.type === 'Percentage' ? `${d.value}%` : formatCurrency(d.value)}</td>
                <td>{formatCurrency(d.minPurchase)}</td>
                <td><span className="badge badge-default">{d.appliesTo}</span></td>
                <td>{d.usedCount || 0} / {d.limitUsage || '∞'}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{d.startDate} → {d.endDate}</td>
                <td><div className="table-actions">
                  <button className="btn-icon" onClick={() => openEdit(d)}><Edit2 size={15} /></button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteDiscount(d.id)}><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}
            {discounts.length === 0 && <tr><td colSpan={8} className="table-empty">No discounts found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Discount' : 'New Discount'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Discount Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Fixed</option><option>Percentage</option></select>
                  </div>
                  <div className="form-group"><label className="form-label">Value</label><input type="number" step="0.01" className="form-input" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Min Purchase ($)</label><input type="number" className="form-input" value={form.minPurchase} onChange={e => setForm({ ...form, minPurchase: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Min Quantity</label><input type="number" className="form-input" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">End Date</label><input type="date" className="form-input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Limit Usage</label><input type="number" className="form-input" value={form.limitUsage} onChange={e => setForm({ ...form, limitUsage: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Applies To</label>
                    <select className="form-select" value={form.appliesTo} onChange={e => setForm({ ...form, appliesTo: e.target.value })}><option>Products</option><option>Subscriptions</option></select>
                  </div>
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
