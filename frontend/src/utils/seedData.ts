import { storage } from './storage';

export function seedData() {
  if (storage.get('seeded')) return;

  // Seed admin user
  const users = [
    { id: 'admin-1', name: 'Admin User', email: 'admin@subflow.com', password: 'Admin@123', role: 'admin', createdAt: new Date().toISOString() },
    { id: 'internal-1', name: 'Sarah Manager', email: 'sarah@subflow.com', password: 'Sarah@123', role: 'internal', createdAt: new Date().toISOString() },
    { id: 'portal-1', name: 'John Customer', email: 'john@example.com', password: 'John@1234', role: 'portal', createdAt: new Date().toISOString() },
  ];
  storage.set('users', users);

  // Seed products
  const products = [
    { id: 'prod-1', name: 'Cloud Hosting Basic', type: 'Service', salesPrice: 29.99, costPrice: 10, createdAt: new Date().toISOString() },
    { id: 'prod-2', name: 'Cloud Hosting Pro', type: 'Service', salesPrice: 79.99, costPrice: 25, createdAt: new Date().toISOString() },
    { id: 'prod-3', name: 'Cloud Hosting Enterprise', type: 'Service', salesPrice: 199.99, costPrice: 60, createdAt: new Date().toISOString() },
    { id: 'prod-4', name: 'SSL Certificate', type: 'Add-on', salesPrice: 9.99, costPrice: 2, createdAt: new Date().toISOString() },
    { id: 'prod-5', name: 'CDN Service', type: 'Add-on', salesPrice: 14.99, costPrice: 5, createdAt: new Date().toISOString() },
    { id: 'prod-6', name: 'Email Suite', type: 'Software', salesPrice: 12.99, costPrice: 4, createdAt: new Date().toISOString() },
  ];
  storage.set('products', products);

  // Seed variants
  const variants = [
    { id: 'var-1', productId: 'prod-1', attribute: 'Region', value: 'US East', extraPrice: 0, createdAt: new Date().toISOString() },
    { id: 'var-2', productId: 'prod-1', attribute: 'Region', value: 'EU West', extraPrice: 5, createdAt: new Date().toISOString() },
    { id: 'var-3', productId: 'prod-2', attribute: 'Storage', value: '500GB', extraPrice: 10, createdAt: new Date().toISOString() },
    { id: 'var-4', productId: 'prod-2', attribute: 'Storage', value: '1TB', extraPrice: 25, createdAt: new Date().toISOString() },
  ];
  storage.set('variants', variants);

  // Seed plans
  const plans = [
    { id: 'plan-1', name: 'Monthly Basic', price: 29.99, billingPeriod: 'Monthly', minQuantity: 1, startDate: '2024-01-01', endDate: '2025-12-31', autoClose: false, closable: true, pausable: true, renewable: true, createdAt: new Date().toISOString() },
    { id: 'plan-2', name: 'Monthly Pro', price: 79.99, billingPeriod: 'Monthly', minQuantity: 1, startDate: '2024-01-01', endDate: '2025-12-31', autoClose: false, closable: true, pausable: true, renewable: true, createdAt: new Date().toISOString() },
    { id: 'plan-3', name: 'Yearly Enterprise', price: 1999.99, billingPeriod: 'Yearly', minQuantity: 1, startDate: '2024-01-01', endDate: '2026-12-31', autoClose: false, closable: true, pausable: false, renewable: true, createdAt: new Date().toISOString() },
    { id: 'plan-4', name: 'Weekly Trial', price: 4.99, billingPeriod: 'Weekly', minQuantity: 1, startDate: '2024-01-01', endDate: '2024-12-31', autoClose: true, closable: true, pausable: false, renewable: false, createdAt: new Date().toISOString() },
  ];
  storage.set('plans', plans);

  // Seed taxes
  const taxes = [
    { id: 'tax-1', name: 'GST', percentage: 18, type: 'Percentage', createdAt: new Date().toISOString() },
    { id: 'tax-2', name: 'Service Tax', percentage: 5, type: 'Percentage', createdAt: new Date().toISOString() },
    { id: 'tax-3', name: 'VAT', percentage: 12, type: 'Percentage', createdAt: new Date().toISOString() },
  ];
  storage.set('taxes', taxes);

  // Seed discounts
  const discounts = [
    { id: 'disc-1', name: 'Early Bird', type: 'Percentage', value: 10, minPurchase: 50, minQuantity: 1, startDate: '2024-01-01', endDate: '2025-06-30', limitUsage: 100, usedCount: 23, appliesTo: 'Products', createdAt: new Date().toISOString() },
    { id: 'disc-2', name: 'Bulk Discount', type: 'Fixed', value: 25, minPurchase: 200, minQuantity: 5, startDate: '2024-01-01', endDate: '2025-12-31', limitUsage: 50, usedCount: 8, appliesTo: 'Subscriptions', createdAt: new Date().toISOString() },
  ];
  storage.set('discounts', discounts);

  // Seed templates
  const templates = [
    { id: 'tmpl-1', name: 'Basic Hosting Package', validityDays: 30, planId: 'plan-1', productLines: [{ productId: 'prod-1', quantity: 1 }], createdAt: new Date().toISOString() },
    { id: 'tmpl-2', name: 'Pro Bundle', validityDays: 30, planId: 'plan-2', productLines: [{ productId: 'prod-2', quantity: 1 }, { productId: 'prod-4', quantity: 1 }, { productId: 'prod-5', quantity: 1 }], createdAt: new Date().toISOString() },
  ];
  storage.set('templates', templates);

  // Seed subscriptions
  const subscriptions = [
    { id: 'sub-1', number: 'SUB-A1B2C3', customerId: 'portal-1', planId: 'plan-1', startDate: '2024-03-01', expirationDate: '2025-03-01', paymentTerms: 'Net 30', status: 'Active', orderLines: [{ productId: 'prod-1', quantity: 2, unitPrice: 29.99, taxId: 'tax-1', amount: 70.78 }], createdAt: new Date().toISOString() },
    { id: 'sub-2', number: 'SUB-D4E5F6', customerId: 'portal-1', planId: 'plan-2', startDate: '2024-06-01', expirationDate: '2025-06-01', paymentTerms: 'Net 15', status: 'Active', orderLines: [{ productId: 'prod-2', quantity: 1, unitPrice: 79.99, taxId: 'tax-1', amount: 94.39 }], createdAt: new Date().toISOString() },
    { id: 'sub-3', number: 'SUB-G7H8I9', customerId: 'portal-1', planId: 'plan-3', startDate: '2024-01-01', expirationDate: '2026-01-01', paymentTerms: 'Net 30', status: 'Confirmed', orderLines: [{ productId: 'prod-3', quantity: 1, unitPrice: 199.99, taxId: 'tax-1', amount: 235.99 }], createdAt: new Date().toISOString() },
    { id: 'sub-4', number: 'SUB-J0K1L2', customerId: 'portal-1', planId: 'plan-4', startDate: '2024-09-01', expirationDate: '2024-09-08', paymentTerms: 'Immediate', status: 'Closed', orderLines: [{ productId: 'prod-4', quantity: 1, unitPrice: 4.99, taxId: 'tax-2', amount: 5.24 }], createdAt: new Date().toISOString() },
  ];
  storage.set('subscriptions', subscriptions);

  // Seed invoices
  const invoices = [
    { id: 'inv-1', number: 'INV-X1Y2Z3', subscriptionId: 'sub-1', customerId: 'portal-1', lines: [{ productId: 'prod-1', quantity: 2, unitPrice: 29.99, taxId: 'tax-1', amount: 70.78 }], subtotal: 59.98, taxAmount: 10.80, total: 70.78, status: 'Paid', createdAt: '2024-03-01T10:00:00Z' },
    { id: 'inv-2', number: 'INV-A3B4C5', subscriptionId: 'sub-2', customerId: 'portal-1', lines: [{ productId: 'prod-2', quantity: 1, unitPrice: 79.99, taxId: 'tax-1', amount: 94.39 }], subtotal: 79.99, taxAmount: 14.40, total: 94.39, status: 'Confirmed', createdAt: '2024-06-01T10:00:00Z' },
    { id: 'inv-3', number: 'INV-D6E7F8', subscriptionId: 'sub-3', customerId: 'portal-1', lines: [{ productId: 'prod-3', quantity: 1, unitPrice: 199.99, taxId: 'tax-1', amount: 235.99 }], subtotal: 199.99, taxAmount: 36.00, total: 235.99, status: 'Draft', createdAt: '2024-01-15T10:00:00Z' },
  ];
  storage.set('invoices', invoices);

  // Seed payments
  const payments = [
    { id: 'pay-1', invoiceId: 'inv-1', method: 'Credit Card', amount: 70.78, date: '2024-03-05', notes: 'Paid in full', createdAt: new Date().toISOString() },
  ];
  storage.set('payments', payments);

  storage.set('seeded', true);
}
