import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/formatters';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { TrendingUp, DollarSign, FileText, Zap, AlertCircle } from 'lucide-react';
import './Reports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

export default function Reports() {
  const { refresh, getSubscriptions, getInvoices, getPayments, getProducts } = useData();

  const data = useMemo(() => {
    const subs = getSubscriptions();
    const invoices = getInvoices();
    const payments = getPayments();
    const products = getProducts();

    const activeSubs = subs.filter(s => s.status === 'Active').length;
    const totalRevenue = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
    const pendingInvoices = invoices.filter(i => i.status === 'Confirmed').length;
    const overdueAmount = invoices.filter(i => i.status === 'Confirmed').reduce((s, i) => s + (Number(i.total) || 0), 0);
    const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.total) || 0), 0);

    // Revenue by month (simulated)
    const monthlyRevenue = [1200, 1900, 1500, 2800, 2200, totalRevenue || 3500, 0, 0, 0, 0, 0, 0];
    
    // Sub status distribution
    const subStatuses = {
      Active: subs.filter(s => s.status === 'Active').length,
      Confirmed: subs.filter(s => s.status === 'Confirmed').length,
      Draft: subs.filter(s => s.status === 'Draft').length,
      Closed: subs.filter(s => s.status === 'Closed').length,
    };

    // Invoice status distribution
    const invStatuses = {
      Paid: paidInvoices,
      Confirmed: pendingInvoices,
      Draft: invoices.filter(i => i.status === 'Draft').length,
    };

    // Product popularity
    const productSales = {};
    subs.forEach(s => {
      (s.orderLines || []).forEach(l => {
        const name = products.find(p => p.id === l.productId)?.name || 'Unknown';
        productSales[name] = (productSales[name] || 0) + (Number(l.quantity) || 1);
      });
    });

    return { activeSubs, totalRevenue, paidInvoices, pendingInvoices, overdueAmount, totalInvoiced, monthlyRevenue, subStatuses, invStatuses, productSales, totalSubs: subs.length };
  }, [refresh]);

  const chartColors = {
    bg: '#1e1e4a',
    title: '#f0f0ff',
    body: '#a0a0cc',
    border: 'rgba(99,102,241,0.3)',
    grid: 'rgba(99,102,241,0.08)',
    ticks: '#6a6a9a',
  };

  const tooltipConfig = { backgroundColor: chartColors.bg, titleColor: chartColors.title, bodyColor: chartColors.body, borderColor: chartColors.border, borderWidth: 1, cornerRadius: 8, padding: 12 };

  const revenueChart = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Revenue',
      data: data.monthlyRevenue,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  const subStatusChart = {
    labels: Object.keys(data.subStatuses),
    datasets: [{
      data: Object.values(data.subStatuses),
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'],
      borderWidth: 0,
    }]
  };

  const invStatusChart = {
    labels: Object.keys(data.invStatuses),
    datasets: [{
      data: Object.values(data.invStatuses),
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
      borderWidth: 0,
    }]
  };

  const productChart = {
    labels: Object.keys(data.productSales).slice(0, 6),
    datasets: [{
      label: 'Units',
      data: Object.values(data.productSales).slice(0, 6),
      backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(168,85,247,0.7)', 'rgba(34,197,94,0.7)', 'rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'],
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: tooltipConfig },
    scales: { x: { grid: { display: false }, ticks: { color: chartColors.ticks } }, y: { grid: { color: chartColors.grid }, ticks: { color: chartColors.ticks, callback: v => '$' + v } } }
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { color: '#a0a0cc', padding: 14, usePointStyle: true } }, tooltip: tooltipConfig }
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: tooltipConfig },
    scales: { x: { grid: { color: chartColors.grid }, ticks: { color: chartColors.ticks } }, y: { grid: { display: false }, ticks: { color: chartColors.ticks } } }
  };

  return (
    <div className="animate-in">
      <div className="page-header"><h1>Reports & Analytics</h1></div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}><Zap size={22} /></div>
          <div className="stat-info"><div className="stat-label">Active Subscriptions</div><div className="stat-value">{data.activeSubs}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}><DollarSign size={22} /></div>
          <div className="stat-info"><div className="stat-label">Total Revenue</div><div className="stat-value">{formatCurrency(data.totalRevenue)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><FileText size={22} /></div>
          <div className="stat-info"><div className="stat-label">Total Invoiced</div><div className="stat-value">{formatCurrency(data.totalInvoiced)}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><AlertCircle size={22} /></div>
          <div className="stat-info"><div className="stat-label">Overdue Amount</div><div className="stat-value">{formatCurrency(data.overdueAmount)}</div></div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="card reports-chart-card reports-chart-wide">
          <h3><TrendingUp size={18} style={{ marginRight: 8 }} />Revenue Trend</h3>
          <div className="reports-chart-container"><Line data={revenueChart} options={lineOptions} /></div>
        </div>
      </div>

      <div className="reports-grid reports-grid-3">
        <div className="card reports-chart-card">
          <h3>Subscription Status</h3>
          <div className="reports-chart-container-sm"><Doughnut data={subStatusChart} options={doughnutOptions} /></div>
        </div>
        <div className="card reports-chart-card">
          <h3>Invoice Status</h3>
          <div className="reports-chart-container-sm"><Doughnut data={invStatusChart} options={doughnutOptions} /></div>
        </div>
        <div className="card reports-chart-card">
          <h3>Product Popularity</h3>
          <div className="reports-chart-container-sm"><Bar data={productChart} options={barOptions} /></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Summary</h3>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="data-table">
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total Subscriptions</td><td style={{ fontWeight: 600 }}>{data.totalSubs}</td></tr>
              <tr><td>Active Subscriptions</td><td style={{ fontWeight: 600, color: 'var(--success)' }}>{data.activeSubs}</td></tr>
              <tr><td>Total Revenue Collected</td><td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(data.totalRevenue)}</td></tr>
              <tr><td>Total Invoiced</td><td style={{ fontWeight: 600 }}>{formatCurrency(data.totalInvoiced)}</td></tr>
              <tr><td>Paid Invoices</td><td style={{ fontWeight: 600, color: 'var(--success)' }}>{data.paidInvoices}</td></tr>
              <tr><td>Pending Invoices</td><td style={{ fontWeight: 600, color: 'var(--warning)' }}>{data.pendingInvoices}</td></tr>
              <tr><td>Outstanding Amount</td><td style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(data.overdueAmount)}</td></tr>
              <tr><td>Collection Rate</td><td style={{ fontWeight: 600, color: 'var(--info)' }}>{data.totalInvoiced > 0 ? Math.round(data.totalRevenue / data.totalInvoiced * 100) : 0}%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
