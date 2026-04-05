// @ts-nocheck
import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:3000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.get('currentUser'));
  const [loading, setLoading] = useState(false);
  // Load users from backend if available, fallback to localStorage
  const [users, setUsers] = useState(() => storage.getAll('users'));

  useEffect(() => {
    if (user) storage.set('currentUser', user);
    else storage.remove('currentUser');
  }, [user]);

  useEffect(() => {
    fetch(`${API_URL}/data`, { signal: AbortSignal.timeout(2000) })
      .then(res => res.json())
      .then(data => { if (data?.users) setUsers(data.users); })
      .catch(() => {
        // No backend — use localStorage users seeded by seedData
        setUsers(storage.getAll('users'));
      });
  }, []);

  const login = (email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { success: false, error: 'Invalid email or password' };
    setUser(found);
    return { success: true };
  };

  const signup = async (name, email, password, role = 'portal') => {
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }
    const newUser = { id: crypto.randomUUID(), name, email, password, role, createdAt: new Date().toISOString() };
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
        signal: AbortSignal.timeout(2000),
      });
      const saved = await res.json();
      setUsers([...users, saved]);
      setUser(saved);
      return { success: true };
    } catch {
      // Backend unreachable — save to localStorage
      storage.addItem('users', newUser);
      const saved = { ...newUser };
      setUsers([...users, saved]);
      setUser(saved);
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    storage.remove('currentUser');
  };

  const isAdmin = user?.role === 'admin';
  const isInternal = user?.role === 'internal';
  const isPortal = user?.role === 'portal';

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, isAdmin, isInternal, isPortal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
