import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, generateInvNumber } from '../../utils/formatters';
import { Plus, Trash2, Search, FileText, Check, X, Send, Printer, ChevronRight } from 'lucide-react';

const statusBadge = (s) => s === 'Paid' ? 'badge-success' : s === 'Confirmed' ? 'badge-info' : s === 'Draft' ? 'badge-warning' : 'badge-danger';

export default function Invoices() {
  const { refresh, getInvoices, addInvoice, updateInvoice, deleteInvoice, getSubscriptions, getUsers, getProducts, getTaxes, findProduct, findTax } = useData();
  const { isAdmin, isPortal, user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ subscriptionId: '', customerId: '', lines: [], subtotal: 0, taxAmount: 0, total: 0, status: 'Draft' });
  const [newLine, setNewLine] = useState({ productId: '', quantity: 1, unitPrice: '', taxId: '' });

  const subs = useMemo(() => getSubscriptions(), [refresh]);
  const products = useMemo(() => getProducts(), [refresh]);
  const taxes = useMemo(() => getTaxes(), [refresh]);

  const invoices = useMemo(() => {
    let all = getInvoices();
    if (isPortal) all = all.filter(i => i.customerId === user?.id);
    if (filterStatus) all = all.filter(i => i.status === filterStatus);
    if (search) all = all.filter(i => i.number?.toLowerCase().includes(search.toLowerCase()));
    return all;
  }, [refresh, search, filterStatus]);

  const getUserName = (id) => getUsers().find(u => u.id === id)?.name || '—';

  const openCreate = () => {
    setForm({ subscriptionId: subs[0]?.id || '', customerId: subs[0]?.customerId || '', lines: [], subtotal: 0, taxAmount: 0, total: 0, status: 'Draft' });
    setShowModal(true);
  };

  const recalc = (lines) => {
    const subtotal = lines.reduce((s, l) => s + (Number(l.unitPrice) * Number(l.quantity)), 0);
    const taxAmount = lines.reduce((s, l) => {
      const tax = findTax(l.taxId);
      return s + (tax ? Number(l.unitPrice) * Number(l.quantity) * tax.percentage / 100 : 0);
    }, 0);
    return { subtotal: Math.round(subtotal * 100) / 100, taxAmount: Math.round(taxAmount * 100) / 100, total: Math.round((subtotal + taxAmount) * 100) / 100 };
  };

  const addLine = () => {
    if (!newLine.productId) return;
    const prod = findProduct(newLine.productId);
    const price = Number(newLine.unitPrice) || prod?.salesPrice || 0;
    const qty = Number(newLine.quantity) || 1;
    const tax = findTax(newLine.taxId);
    const taxAmt = tax ? price * qty * tax.percentage / 100 : 0;
    const newLines = [...form.lines, { ...newLine, unitPrice: price, quantity: qty, amount: Math.round((price * qty + taxAmt) * 100) / 100 }];
    const totals = recalc(newLines);
    setForm({ ...form, lines: newLines, ...totals });
    setNewLine({ productId: '', quantity: 1, unitPrice: '', taxId: '' });
  };

  const handleSave = (e) => {
    e.preventDefault();
    addInvoice({ ...form, number: generateInvNumber() });
    setShowModal(false);
  };

  const advanceStatus = (inv) => {
    const flow = ['Draft', 'Confirmed', 'Paid'];
    const idx = flow.indexOf(inv.status);
    if (idx < flow.length - 1) updateInvoice(inv.id, { status: flow[idx + 1] });
  };

  const cancelInvoice = (inv) => updateInvoice(inv.id, { status: 'Cancelled' });

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Invoices</h1>
        <div className="page-header-actions">
          <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 120 }}>
            <option value="">All Status</option>
            <option>Draft</option><option>Confirmed</option><option>Paid</option><option>Cancelled</option>
          </select>
          {!isPortal && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Invoice</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Invoice #</th><th>Customer</th><th>Status</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 600 }}><FileText size={14} style={{ marginRight: 8, opacity: 0.5 }} />{inv.number}</td>
                <td>{getUserName(inv.customerId)}</td>
                <td><span className={`badge ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                <td>{formatCurrency(inv.subtotal)}</td>
                <td>{formatCurrency(inv.taxAmount)}</td>
                <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total)}</td>
                <td>{formatDate(inv.createdAt)}</td>
                <td>
                  <div className="table-actions">
                    {inv.status !== 'Paid' && inv.status !== 'Cancelled' && !isPortal && (
                      <button className="btn btn-sm btn-secondary" onClick={() => advanceStatus(inv)} title="Advance"><ChevronRight size={14} /></button>
                    )}
                    {inv.status === 'Draft' && !isPortal && (
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => cancelInvoice(inv)} title="Cancel"><X size={15} /></button>
                    )}
                    {isAdmin && <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteInvoice(inv.id)}><Trash2 size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={8} className="table-empty">No invoices found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Invoice</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subscription</label>
                  <select className="form-select" value={form.subscriptionId} onChange={e => { const s = subs.find(x => x.id === e.target.value); setForm({ ...form, subscriptionId: e.target.value, customerId: s?.customerId || '' }); }}>
                    <option value="">Select...</option>
                    {subs.map(s => <option key={s.id} value={s.id}>{s.number}</option>)}
                  </select>
                </div>
                <h4 style={{ margin: '12px 0 8px' }}>Invoice Lines</h4>
                {form.lines.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <span style={{ flex: 1 }}>{findProduct(l.productId)?.name || '?'}</span>
                    <span>×{l.quantity}</span>
                    <span>{formatCurrency(l.amount)}</span>
                    <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => { const nl = form.lines.filter((_, j) => j !== i); setForm({ ...form, lines: nl, ...recalc(nl) }); }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="form-select" style={{ flex: 2 }} value={newLine.productId} onChange={e => { const p = findProduct(e.target.value); setNewLine({ ...newLine, productId: e.target.value, unitPrice: p?.salesPrice || '' }); }}>
                    <option value="">Product...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="form-input" style={{ width: 55 }} value={newLine.quantity} onChange={e => setNewLine({ ...newLine, quantity: e.target.value })} />
                  <select className="form-select" style={{ flex: 1 }} value={newLine.taxId} onChange={e => setNewLine({ ...newLine, taxId: e.target.value })}>
                    <option value="">No Tax</option>{taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.percentage}%)</option>)}
                  </select>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addLine}><Plus size={14} /></button>
                </div>
                {form.lines.length > 0 && (
                  <div style={{ marginTop: 16, textAlign: 'right', lineHeight: 2 }}>
                    <div>Subtotal: {formatCurrency(form.subtotal)}</div>
                    <div>Tax: {formatCurrency(form.taxAmount)}</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total: {formatCurrency(form.total)}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
