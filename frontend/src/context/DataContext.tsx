// @ts-nocheck
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { storage } from '../utils/storage';

const DataContext = createContext(null);
const API_URL = 'http://localhost:3000/api';

async function tryFetch(url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error('not ok');
    return await res.json();
  } catch {
    return null;
  }
}

function getLocalData() {
  return {
    products: storage.getAll('products'),
    variants: storage.getAll('variants'),
    plans: storage.getAll('plans'),
    subscriptions: storage.getAll('subscriptions'),
    templates: storage.getAll('templates'),
    invoices: storage.getAll('invoices'),
    payments: storage.getAll('payments'),
    discounts: storage.getAll('discounts'),
    taxes: storage.getAll('taxes'),
    users: storage.getAll('users'),
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(() => getLocalData());
  const [usingBackend, setUsingBackend] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const reload = useCallback(() => setRefresh(r => r + 1), []);

  useEffect(() => {
    tryFetch(`${API_URL}/data`).then(result => {
      if (result) {
        setData(result);
        setUsingBackend(true);
      } else {
        setData(getLocalData());
        setUsingBackend(false);
      }
    });
  }, [refresh]);

  function localAdd(key: string, item: object) {
    storage.addItem(key, item);
    reload();
  }
  function localUpdate(key: string, id: string, updates: object) {
    storage.updateItem(key, id, updates);
    reload();
  }
  function localDelete(key: string, id: string) {
    storage.deleteItem(key, id);
    reload();
  }

  function crud(key: string, apiPath: string) {
    return {
      add: (item) => usingBackend
        ? fetch(`${API_URL}/${apiPath}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(reload)
        : localAdd(key, item),
      update: (id, item) => usingBackend
        ? fetch(`${API_URL}/${apiPath}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }).then(reload)
        : localUpdate(key, id, item),
      remove: (id) => usingBackend
        ? fetch(`${API_URL}/${apiPath}/${id}`, { method: 'DELETE' }).then(reload)
        : localDelete(key, id),
    };
  }

  const productsC  = crud('products', 'products');
  const variantsC  = crud('variants', 'variants');
  const plansC     = crud('plans', 'plans');
  const subsC      = crud('subscriptions', 'subscriptions');
  const templatesC = crud('templates', 'templates');
  const invoicesC  = crud('invoices', 'invoices');
  const paymentsC  = crud('payments', 'payments');
  const discountsC = crud('discounts', 'discounts');
  const taxesC     = crud('taxes', 'taxes');
  const usersC     = crud('users', 'users');

  return (
    <DataContext.Provider value={{
      refresh,
      getProducts: () => data.products || [],
      addProduct: productsC.add, updateProduct: productsC.update, deleteProduct: productsC.remove,
      findProduct: (id) => (data.products || []).find(x => x.id === id),

      getVariants: (productId?) => (data.variants || []).filter(v => !productId || v.productId === productId),
      addVariant: variantsC.add, updateVariant: variantsC.update, deleteVariant: variantsC.remove,

      getPlans: () => data.plans || [],
      addPlan: plansC.add, updatePlan: plansC.update, deletePlan: plansC.remove,
      findPlan: (id) => (data.plans || []).find(x => x.id === id),

      getSubscriptions: () => data.subscriptions || [],
      addSubscription: subsC.add, updateSubscription: subsC.update, deleteSubscription: subsC.remove,

      getTemplates: () => data.templates || [],
      addTemplate: templatesC.add, updateTemplate: templatesC.update, deleteTemplate: templatesC.remove,

      getInvoices: () => data.invoices || [],
      addInvoice: invoicesC.add, updateInvoice: invoicesC.update, deleteInvoice: invoicesC.remove,

      getPayments: () => data.payments || [],
      addPayment: paymentsC.add, deletePayment: paymentsC.remove,

      getDiscounts: () => data.discounts || [],
      addDiscount: discountsC.add, updateDiscount: discountsC.update, deleteDiscount: discountsC.remove,

      getTaxes: () => data.taxes || [],
      addTax: taxesC.add, updateTax: taxesC.update, deleteTax: taxesC.remove,
      findTax: (id) => (data.taxes || []).find(x => x.id === id),

      getUsers: () => data.users || [],
      addUser: (u) => { usersC.add(u); return true; },
      updateUser: usersC.update, deleteUser: usersC.remove,
      findUser: (id) => (data.users || []).find(x => x.id === id),
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
