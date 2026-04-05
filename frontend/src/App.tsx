import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { seedData } from './utils/seedData';

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Plans from './pages/Plans/Plans';
import Variants from './pages/Variants/Variants';
import Subscriptions from './pages/Subscriptions/Subscriptions';
import Templates from './pages/Templates/Templates';
import Invoices from './pages/Invoices/Invoices';
import Payments from './pages/Payments/Payments';
import Discounts from './pages/Discounts/Discounts';
import Taxes from './pages/Taxes/Taxes';
import UsersPage from './pages/Users/Users';
import Reports from './pages/Reports/Reports';

// Seed demo data on first load
seedData();

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function InternalRoute({ children }) {
  const { isAdmin, isInternal } = useAuth();
  if (!isAdmin && !isInternal) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

            {/* Protected routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<InternalRoute><Products /></InternalRoute>} />
              <Route path="/plans" element={<InternalRoute><Plans /></InternalRoute>} />
              <Route path="/variants" element={<InternalRoute><Variants /></InternalRoute>} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/templates" element={<InternalRoute><Templates /></InternalRoute>} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/discounts" element={<AdminRoute><Discounts /></AdminRoute>} />
              <Route path="/taxes" element={<AdminRoute><Taxes /></AdminRoute>} />
              <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
              <Route path="/reports" element={<InternalRoute><Reports /></InternalRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
