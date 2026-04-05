import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Search, ScrollText } from 'lucide-react';

export default function Templates() {
  const { refresh, getTemplates, addTemplate, updateTemplate, deleteTemplate, getPlans, getProducts, findProduct, findPlan } = useData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', validityDays: 30, planId: '', productLines: [] });
  const [newLineProd, setNewLineProd] = useState('');
  const [newLineQty, setNewLineQty] = useState(1);

  const plans = useMemo(() => getPlans(), [refresh]);
  const products = useMemo(() => getProducts(), [refresh]);
  const templates = useMemo(() => {
    const all = getTemplates();
    if (!search) return all;
    return all.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', validityDays: 30, planId: plans[0]?.id || '', productLines: [] }); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t }); setShowModal(true); };

  const addProductLine = () => {
    if (!newLineProd) return;
    setForm({ ...form, productLines: [...form.productLines, { productId: newLineProd, quantity: Number(newLineQty) || 1 }] });
    setNewLineProd(''); setNewLineQty(1);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const data = { ...form, validityDays: Number(form.validityDays) };
    if (editing) updateTemplate(editing.id, data); else addTemplate(data);
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Quotation Templates</h1>
        <div className="page-header-actions">
          <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Template</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Template Name</th><th>Validity (Days)</th><th>Recurring Plan</th><th>Products</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}><ScrollText size={14} style={{ marginRight: 8, opacity: 0.5 }} />{t.name}</td>
                <td>{t.validityDays}</td>
                <td><span className="badge badge-info">{findPlan(t.planId)?.name || '—'}</span></td>
                <td>{(t.productLines || []).map((l, i) => <span key={i} className="badge badge-default" style={{ marginRight: 4 }}>{findProduct(l.productId)?.name || '?'} ×{l.quantity}</span>)}</td>
                {isAdmin && (
                  <td><div className="table-actions">
                    <button className="btn-icon" onClick={() => openEdit(t)}><Edit2 size={15} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteTemplate(t.id)}><Trash2 size={15} /></button>
                  </div></td>
                )}
              </tr>
            ))}
            {templates.length === 0 && <tr><td colSpan={5} className="table-empty">No templates found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Template' : 'New Template'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Template Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Validity (Days)</label><input type="number" className="form-input" value={form.validityDays} onChange={e => setForm({ ...form, validityDays: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Recurring Plan</label>
                    <select className="form-select" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })}>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <h4 style={{ margin: '12px 0 8px' }}>Product Lines</h4>
                {form.productLines.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span style={{ flex: 1 }}>{findProduct(l.productId)?.name || l.productId}</span>
                    <span>×{l.quantity}</span>
                    <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setForm({ ...form, productLines: form.productLines.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="form-select" style={{ flex: 2 }} value={newLineProd} onChange={e => setNewLineProd(e.target.value)}>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="form-input" style={{ width: 60 }} value={newLineQty} onChange={e => setNewLineQty(e.target.value)} min={1} />
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addProductLine}><Plus size={14} /></button>
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
