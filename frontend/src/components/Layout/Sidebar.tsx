// @ts-nocheck
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, RefreshCw, Layers, FileText,
  Receipt, CreditCard, Percent, Calculator, Users,
  BarChart3, LogOut, ScrollText
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'internal', 'portal'] },
  { path: '/products', label: 'Products', icon: Package, roles: ['admin', 'internal'] },
  { path: '/plans', label: 'Recurring Plans', icon: RefreshCw, roles: ['admin', 'internal'] },
  { path: '/variants', label: 'Product Variants', icon: Layers, roles: ['admin', 'internal'] },
  { path: '/subscriptions', label: 'Subscriptions', icon: Receipt, roles: ['admin', 'internal', 'portal'] },
  { path: '/templates', label: 'Quotation Templates', icon: ScrollText, roles: ['admin', 'internal'] },
  { path: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin', 'internal', 'portal'] },
  { path: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'internal', 'portal'] },
  { path: '/discounts', label: 'Discounts', icon: Percent, roles: ['admin'] },
  { path: '/taxes', label: 'Taxes', icon: Calculator, roles: ['admin'] },
  { path: '/users', label: 'Users & Contacts', icon: Users, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'internal'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filtered = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="14,1 25.26,7.5 25.26,20.5 14,27 2.74,20.5 2.74,7.5" fill="url(#hexGrad)" />
            <polygon points="14,1 25.26,7.5 25.26,20.5 14,27 2.74,20.5 2.74,7.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <text x="14" y="17" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif" letterSpacing="0.5">SS</text>
            <defs>
              <linearGradient id="hexGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-title-stay">Stay </span><span className="sidebar-title-subed">Subed</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
