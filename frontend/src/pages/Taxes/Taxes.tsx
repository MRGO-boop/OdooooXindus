import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Edit2, Trash2, Search, Calculator } from 'lucide-react';

export default function Taxes() {
  const { refresh, getTaxes, addTax, updateTax, deleteTax } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', percentage: '', type: 'Percentage' });

  const taxes = useMemo(() => {
    const all = getTaxes();
    if (!search) return all;
    return all.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', percentage: '', type: 'Percentage' }); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm(t); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    const data = { ...form, percentage: Number(form.percentage) };
    if (editing) updateTax(editing.id, data); else addTax(data);
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Taxes</h1>
        <div className="page-header-actions">
          <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Search taxes..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Tax</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Tax Name</th><th>Percentage</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {taxes.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}><Calculator size={14} style={{ marginRight: 8, opacity: 0.5 }} />{t.name}</td>
                <td style={{ fontWeight: 600, color: 'var(--warning)' }}>{t.percentage}%</td>
                <td><span className="badge badge-info">{t.type}</span></td>
                <td><div className="table-actions">
                  <button className="btn-icon" onClick={() => openEdit(t)}><Edit2 size={15} /></button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteTax(t.id)}><Trash2 size={15} /></button>
                </div></td>
              </tr>
            ))}
            {taxes.length === 0 && <tr><td colSpan={4} className="table-empty">No taxes configured</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Tax' : 'New Tax'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Tax Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Percentage (%)</label><input type="number" step="0.01" className="form-input" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Percentage</option><option>Fixed</option></select>
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
