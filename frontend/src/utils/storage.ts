const PREFIX = 'subflow_';

export const storage = {
  get(key) {
    try {
      const data = localStorage.getItem(PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  getAll(key) {
    return this.get(key) || [];
  },
  addItem(key, item) {
    const items = this.getAll(key);
    items.push({ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    this.set(key, items);
    return items;
  },
  updateItem(key, id, updates) {
    const items = this.getAll(key).map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    );
    this.set(key, items);
    return items;
  },
  deleteItem(key, id) {
    const items = this.getAll(key).filter(item => item.id !== id);
    this.set(key, items);
    return items;
  },
  findById(key, id) {
    return this.getAll(key).find(item => item.id === id) || null;
  }
};
