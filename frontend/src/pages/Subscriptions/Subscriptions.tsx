import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, generateSubNumber } from '../../utils/formatters';
import { Plus, Edit2, Trash2, Search, Zap, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
const statusBadge = (s) => s === 'Active' ? 'badge-success' : s === 'Confirmed' ? 'badge-info' : s === 'Closed' ? 'badge-default' : 'badge-warning';

export default function Subscriptions() {
  const { refresh, getSubscriptions, addSubscription, updateSubscription, deleteSubscription, getPlans, getProducts, getUsers, getTaxes, findProduct, findTax } = useData();
  const { isAdmin, isPortal, user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ customerId: '', planId: '', startDate: '', expirationDate: '', paymentTerms: 'Net 30', status: 'Draft', orderLines: [] });
  const [newLine, setNewLine] = useState({ productId: '', quantity: 1, unitPrice: '', taxId: '' });

  const plans = useMemo(() => getPlans(), [refresh]);
  const products = useMemo(() => getProducts(), [refresh]);
  const users = useMemo(() => getUsers().filter(u => u.role === 'portal'), [refresh]);
  const taxes = useMemo(() => getTaxes(), [refresh]);

  const subscriptions = useMemo(() => {
    let all = getSubscriptions();
    if (isPortal) all = all.filter(s => s.customerId === user?.id);
    if (filterStatus) all = all.filter(s => s.status === filterStatus);
    if (search) all = all.filter(s => s.number.toLowerCase().includes(search.toLowerCase()));
    return all;
  }, [refresh, search, filterStatus]);

  const getUserName = (id) => getUsers().find(u => u.id === id)?.name || '—';
  const getPlanName = (id) => plans.find(p => p.id === id)?.name || '—';

  const openCreate = () => {
    setEditing(null);
    setForm({ customerId: users[0]?.id || '', planId: plans[0]?.id || '', startDate: '', expirationDate: '', paymentTerms: 'Net 30', status: 'Draft', orderLines: [] });
    setShowModal(true);
  };
  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setShowModal(true); };

  const addLine = () => {
    if (!newLine.productId) return;
    const prod = findProduct(newLine.productId);
    const tax = findTax(newLine.taxId);
    const qty = Number(newLine.quantity) || 1;
    const price = Number(newLine.unitPrice) || prod?.salesPrice || 0;
    const taxAmt = tax ? (price * qty * tax.percentage / 100) : 0;
    const amount = price * qty + taxAmt;
    setForm({ ...form, orderLines: [...form.orderLines, { ...newLine, quantity: qty, unitPrice: price, amount: Math.round(amount * 100) / 100 }] });
    setNewLine({ productId: '', quantity: 1, unitPrice: '', taxId: '' });
  };

  const removeLine = (idx) => {
    setForm({ ...form, orderLines: form.orderLines.filter((_, i) => i !== idx) });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) {
      updateSubscription(editing.id, form);
    } else {
      addSubscription({ ...form, number: generateSubNumber() });
    }
    setShowModal(false);
  };

  const advanceStatus = (sub) => {
    const idx = STATUS_OPTIONS.indexOf(sub.status);
    if (idx < STATUS_OPTIONS.length - 1) {
      updateSubscription(sub.id, { status: STATUS_OPTIONS[idx + 1] });
    }
  };

  const getTotal = (lines) => lines.reduce((s, l) => s + (l.amount || 0), 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Subscriptions</h1>
        <div className="page-header-actions">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 120 }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          {!isPortal && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Subscription</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Number</th><th>Customer</th><th>Plan</th><th>Status</th><th>Start</th><th>Expires</th><th>Total</th><th>Actions</th></tr></thead>
          <tbody>
            {subscriptions.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}><Zap size={14} style={{ marginRight: 8, opacity: 0.5 }} />{s.number}</td>
                <td>{getUserName(s.customerId)}</td>
                <td>{getPlanName(s.planId)}</td>
                <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                <td>{s.startDate}</td>
                <td>{s.expirationDate}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(getTotal(s.orderLines || []))}</td>
                <td>
                  <div className="table-actions">
                    {s.status !== 'Closed' && !isPortal && <button className="btn btn-sm btn-secondary" onClick={() => advanceStatus(s)} title="Advance status"><ChevronRight size={14} /></button>}
                    {!isPortal && <button className="btn-icon" onClick={() => openEdit(s)}><Edit2 size={15} /></button>}
                    {isAdmin && <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteSubscription(s.id)}><Trash2 size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && <tr><td colSpan={8} className="table-empty">No subscriptions found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Subscription' : 'New Subscription'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer</label>
                    <select className="form-select" value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">Select...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plan</label>
                    <select className="form-select" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })}>
                      <option value="">Select...</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Expiration Date</label><input type="date" className="form-input" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Terms</label>
                    <select className="form-select" value={form.paymentTerms} onChange={e => setForm({ ...form, paymentTerms: e.target.value })}>
                      <option>Immediate</option><option>Net 15</option><option>Net 30</option><option>Net 60</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <h4 style={{ margin: '16px 0 8px' }}>Order Lines</h4>
                {form.orderLines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span style={{ flex: 1 }}>{findProduct(line.productId)?.name || line.productId}</span>
                    <span>×{line.quantity}</span>
                    <span>{formatCurrency(line.unitPrice)}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(line.amount)}</span>
                    <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeLine(idx)}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <select className="form-select" style={{ flex: 2, fontSize: '0.85rem' }} value={newLine.productId} onChange={e => { const p = findProduct(e.target.value); setNewLine({ ...newLine, productId: e.target.value, unitPrice: p?.salesPrice || '' }); }}>
                    <option value="">Product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="form-input" style={{ width: 60, fontSize: '0.85rem' }} placeholder="Qty" value={newLine.quantity} onChange={e => setNewLine({ ...newLine, quantity: e.target.value })} />
                  <input type="number" className="form-input" style={{ width: 80, fontSize: '0.85rem' }} placeholder="Price" value={newLine.unitPrice} onChange={e => setNewLine({ ...newLine, unitPrice: e.target.value })} />
                  <select className="form-select" style={{ flex: 1, fontSize: '0.85rem' }} value={newLine.taxId} onChange={e => setNewLine({ ...newLine, taxId: e.target.value })}>
                    <option value="">No Tax</option>
                    {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>)}
                  </select>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addLine}><Plus size={14} /></button>
                </div>
                {form.orderLines.length > 0 && (
                  <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 700, fontSize: '1.1rem' }}>
                    Total: {formatCurrency(getTotal(form.orderLines))}
                  </div>
                )}
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
