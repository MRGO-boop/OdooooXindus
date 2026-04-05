import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';

export default function Products() {
  const { refresh, getProducts, addProduct, updateProduct, deleteProduct } = useData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Service', salesPrice: '', costPrice: '' });

  const products = useMemo(() => {
    const all = getProducts();
    if (!search) return all;
    return all.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [refresh, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', type: 'Service', salesPrice: '', costPrice: '' }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, type: p.type, salesPrice: p.salesPrice, costPrice: p.costPrice }); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateProduct(editing.id, { ...form, salesPrice: Number(form.salesPrice), costPrice: Number(form.costPrice) });
    } else {
      addProduct({ ...form, salesPrice: Number(form.salesPrice), costPrice: Number(form.costPrice) });
    }
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Products</h1>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Product</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Type</th>
              <th>Sales Price</th>
              <th>Cost Price</th>
              <th>Margin</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}><Package size={14} style={{ marginRight: 8, opacity: 0.5 }} />{p.name}</td>
                <td><span className="badge badge-info">{p.type}</span></td>
                <td>{formatCurrency(p.salesPrice)}</td>
                <td>{formatCurrency(p.costPrice)}</td>
                <td style={{ color: 'var(--success)' }}>{formatCurrency(p.salesPrice - p.costPrice)}</td>
                {isAdmin && (
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" onClick={() => openEdit(p)}><Edit2 size={15} /></button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteProduct(p.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="table-empty">No products found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option>Service</option>
                    <option>Software</option>
                    <option>Add-on</option>
                    <option>Hardware</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sales Price ($)</label>
                    <input type="number" step="0.01" className="form-input" value={form.salesPrice} onChange={e => setForm({ ...form, salesPrice: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost Price ($)</label>
                    <input type="number" step="0.01" className="form-input" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} required />
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
