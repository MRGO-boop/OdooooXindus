import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Search, Layers } from 'lucide-react';

export default function Variants() {
  const { refresh, getVariants, addVariant, updateVariant, deleteVariant, getProducts } = useData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ productId: '', attribute: '', value: '', extraPrice: '' });

  const products = useMemo(() => getProducts(), [refresh]);
  const variants = useMemo(() => {
    const all = getVariants();
    if (!search) return all;
    return all.filter(v => v.attribute.toLowerCase().includes(search.toLowerCase()) || v.value.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const getProductName = (id) => products.find(p => p.id === id)?.name || '—';

  const openCreate = () => { setEditing(null); setForm({ productId: products[0]?.id || '', attribute: '', value: '', extraPrice: '' }); setShowModal(true); };
  const openEdit = (v) => { setEditing(v); setForm(v); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    const data = { ...form, extraPrice: Number(form.extraPrice) };
    if (editing) updateVariant(editing.id, data); else addVariant(data);
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Product Variants</h1>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input placeholder="Search variants..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Variant</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Product</th><th>Attribute</th><th>Value</th><th>Extra Price</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {variants.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}><Layers size={14} style={{ marginRight: 8, opacity: 0.5 }} />{getProductName(v.productId)}</td>
                <td>{v.attribute}</td>
                <td><span className="badge badge-default">{v.value}</span></td>
                <td style={{ color: 'var(--success)' }}>+{formatCurrency(v.extraPrice)}</td>
                {isAdmin && (
                  <td><div className="table-actions">
                    <button className="btn-icon" onClick={() => openEdit(v)}><Edit2 size={15} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteVariant(v.id)}><Trash2 size={15} /></button>
                  </div></td>
                )}
              </tr>
            ))}
            {variants.length === 0 && <tr><td colSpan={5} className="table-empty">No variants found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Variant' : 'New Variant'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <select className="form-select" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Attribute</label><input className="form-input" value={form.attribute} onChange={e => setForm({ ...form, attribute: e.target.value })} placeholder="e.g., Region, Storage" required /></div>
                  <div className="form-group"><label className="form-label">Value</label><input className="form-input" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="e.g., US East, 500GB" required /></div>
                </div>
                <div className="form-group"><label className="form-label">Extra Price ($)</label><input type="number" step="0.01" className="form-input" value={form.extraPrice} onChange={e => setForm({ ...form, extraPrice: e.target.value })} required /></div>
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
