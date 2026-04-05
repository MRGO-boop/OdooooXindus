import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/formatters';
import { Zap, DollarSign, CreditCard, AlertTriangle, TrendingUp, Package, Users, FileText } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { refresh, getSubscriptions, getInvoices, getPayments, getProducts, getUsers } = useData();

  const stats = useMemo(() => {
    const subs = getSubscriptions();
    const invoices = getInvoices();
    const payments = getPayments();
    const products = getProducts();
    const users = getUsers();

    const activeSubs = subs.filter(s => s.status === 'Active').length;
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPaid = invoices.filter(i => i.status === 'Paid').length;
    const overdue = invoices.filter(i => i.status === 'Confirmed').length;
    const totalInvoiceValue = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    return { activeSubs, totalRevenue, totalPaid, overdue, totalSubs: subs.length, totalProducts: products.length, totalUsers: users.length, totalInvoices: invoices.length, totalInvoiceValue, subs, invoices };
  }, [refresh]);

  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue ($)',
      data: [1200, 1900, 1500, 2800, 2200, stats.totalRevenue || 3500],
      backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(99,102,241,0.7)', 'rgba(99,102,241,0.7)', 'rgba(168,85,247,0.7)', 'rgba(168,85,247,0.7)', 'rgba(168,85,247,0.7)'],
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const doughnutData = {
    labels: ['Active', 'Confirmed', 'Draft', 'Closed'],
    datasets: [{
      data: [
        stats.subs.filter(s => s.status === 'Active').length,
        stats.subs.filter(s => s.status === 'Confirmed').length,
        stats.subs.filter(s => s.status === 'Draft').length,
        stats.subs.filter(s => s.status === 'Closed').length,
      ],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'],
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e1e4a', titleColor: '#f0f0ff', bodyColor: '#a0a0cc', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, cornerRadius: 8, padding: 12 } },
    scales: { x: { grid: { display: false }, ticks: { color: '#6a6a9a' } }, y: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { color: '#6a6a9a' } } }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { color: '#a0a0cc', padding: 16, usePointStyle: true, pointStyleWidth: 8 } } }
  };

  return (
    <div className="dashboard animate-in">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}><Zap size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Active Subscriptions</div>
            <div className="stat-value">{stats.activeSubs}</div>
            <div className="stat-change" style={{ color: 'var(--success)' }}>↑ of {stats.totalSubs} total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}><DollarSign size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-change" style={{ color: 'var(--success)' }}>↑ collected</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><CreditCard size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Paid Invoices</div>
            <div className="stat-value">{stats.totalPaid}</div>
            <div className="stat-change" style={{ color: 'var(--info)' }}>of {stats.totalInvoices} total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <div className="stat-label">Pending Invoices</div>
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-change" style={{ color: 'var(--warning)' }}>needs attention</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-chart-card">
          <h3>Revenue Overview</h3>
          <div className="chart-container">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="card dashboard-chart-card">
          <h3>Subscription Status</h3>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-3">
        <div className="card quick-stat-mini">
          <Package size={20} />
          <div>
            <div className="quick-stat-val">{stats.totalProducts}</div>
            <div className="quick-stat-label">Products</div>
          </div>
        </div>
        <div className="card quick-stat-mini">
          <Users size={20} />
          <div>
            <div className="quick-stat-val">{stats.totalUsers}</div>
            <div className="quick-stat-label">Users</div>
          </div>
        </div>
        <div className="card quick-stat-mini">
          <FileText size={20} />
          <div>
            <div className="quick-stat-val">{formatCurrency(stats.totalInvoiceValue)}</div>
            <div className="quick-stat-label">Invoice Value</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Subscriptions</h3>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Expiration</th>
              </tr>
            </thead>
            <tbody>
              {stats.subs.slice(0, 5).map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.number}</td>
                  <td>
                    <span className={`badge ${sub.status === 'Active' ? 'badge-success' : sub.status === 'Confirmed' ? 'badge-info' : sub.status === 'Closed' ? 'badge-default' : 'badge-warning'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>{sub.startDate}</td>
                  <td>{sub.expirationDate}</td>
                </tr>
              ))}
              {stats.subs.length === 0 && (
                <tr><td colSpan={4} className="table-empty">No subscriptions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
