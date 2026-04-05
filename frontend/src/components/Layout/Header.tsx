// @ts-nocheck
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import './Header.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/plans': 'Recurring Plans',
  '/variants': 'Product Variants',
  '/subscriptions': 'Subscriptions',
  '/templates': 'Quotation Templates',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/discounts': 'Discounts',
  '/taxes': 'Taxes',
  '/users': 'Users & Contacts',
  '/reports': 'Reports',
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Stay Subed';

  return (
    <header className="header">
      <h2 className="header-title">{title}</h2>
      <div className="header-actions">
        <div className="header-search">
          <Search size={16} className="header-search-icon" />
          <input type="text" placeholder="Search..." className="header-search-input" />
        </div>
        <button className="btn-icon header-bell">
          <Bell size={18} />
          <span className="header-bell-dot"></span>
        </button>
      </div>
    </header>
  );
}
