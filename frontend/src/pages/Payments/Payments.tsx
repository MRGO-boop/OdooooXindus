import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Trash2, Search, CreditCard } from 'lucide-react';

export default function Payments() {
  const { refresh, getPayments, addPayment, deletePayment, getInvoices } = useData();
  const { isAdmin, isPortal, user } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', method: 'Credit Card', amount: '', date: '', notes: '' });

  const invoices = useMemo(() => {
    let inv = getInvoices();
    if (isPortal) inv = inv.filter(i => i.customerId === user?.id);
    return inv;
  }, [refresh]);

  const payments = useMemo(() => {
    let all = getPayments();
    if (search) all = all.filter(p => p.method.toLowerCase().includes(search.toLowerCase()));
    return all;
  }, [refresh, search]);

  const getInvNumber = (id) => invoices.find(i => i.id === id)?.number || '—';

  const openCreate = () => {
    const unpaid = invoices.find(i => i.status === 'Confirmed');
    setForm({ invoiceId: unpaid?.id || invoices[0]?.id || '', method: 'Credit Card', amount: unpaid?.total || '', date: new Date().toISOString().slice(0, 10), notes: '' });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    addPayment({ ...form, amount: Number(form.amount) });
    setShowModal(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>Payments</h1>
        <div className="page-header-actions">
          <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          {!isPortal && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Record Payment</button>}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Invoice</th><th>Method</th><th>Amount</th><th>Date</th><th>Notes</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}><CreditCard size={14} style={{ marginRight: 8, opacity: 0.5 }} />{getInvNumber(p.invoiceId)}</td>
                <td><span className="badge badge-info">{p.method}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                <td>{formatDate(p.date)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.notes || '—'}</td>
                {isAdmin && (
                  <td><button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deletePayment(p.id)}><Trash2 size={15} /></button></td>
                )}
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={6} className="table-empty">No payments recorded</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Record Payment</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Invoice</label>
                  <select className="form-select" value={form.invoiceId} onChange={e => { const inv = invoices.find(i => i.id === e.target.value); setForm({ ...form, invoiceId: e.target.value, amount: inv?.total || form.amount }); }}>
                    <option value="">Select invoice...</option>
                    {invoices.map(i => <option key={i.id} value={i.id}>{i.number} — {formatCurrency(i.total)} ({i.status})</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-select" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                      <option>Credit Card</option><option>Debit Card</option><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Check</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount ($)</label>
                    <input type="number" step="0.01" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
