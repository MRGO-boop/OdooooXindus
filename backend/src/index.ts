// @ts-nocheck
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createPool } from 'mysql2/promise';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── MySQL Connection Pool ───────────────────────────────────────────────────
const pool = createPool({
  host: 'localhost',
  port: 3306,
  database: 'mihirabc',   // your database name
  user: 'root',
  password: '',            // XAMPP default = no password
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── Whitelisted table names ─────────────────────────────────────────────────
const TABLES = ['users', 'products', 'variants', 'plans', 'taxes',
                'discounts', 'templates', 'subscriptions', 'invoices', 'payments'];

// Columns stored as JSON strings (LONGTEXT in MySQL)
const JSON_COLS: Record<string, string[]> = {
  templates:     ['productLines'],
  subscriptions: ['orderLines'],
  invoices:      ['lines'],
};

// Reserved words in MySQL that need backticks
const RESERVED: Record<string, string[]> = {
  variants:      ['value'],
  discounts:     ['value'],
  subscriptions: ['number', 'status'],
  invoices:      ['number', 'lines', 'status'],
  payments:      ['date'],
};

function quoteCol(table: string, col: string): string {
  return (RESERVED[table] || []).includes(col) ? `\`${col}\`` : col;
}

function parseJsonCols(table: string, rows: any[]): any[] {
  const jsonCols = JSON_COLS[table] || [];
  return rows.map(row => {
    jsonCols.forEach(col => {
      if (row[col] && typeof row[col] === 'string') {
        try { row[col] = JSON.parse(row[col]); } catch {}
      }
    });
    return row;
  });
}

// ─── GET /api/data ───────────────────────────────────────────────────────────
app.get('/api/data', async (req: Request, res: Response) => {
  try {
    const result: Record<string, any[]> = {};
    await Promise.all(
      TABLES.map(async (table) => {
        const [rows] = await pool.query(`SELECT * FROM \`${table}\` ORDER BY createdAt ASC`);
        result[table] = parseJsonCols(table, rows as any[]);
      })
    );
    res.json(result);
  } catch (err: any) {
    console.error('GET /api/data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/:collection ───────────────────────────────────────────────────
app.post('/api/:collection', async (req: Request, res: Response) => {
  const table = req.params.collection;
  if (!TABLES.includes(table)) return res.status(400).json({ error: 'Invalid collection' });

  const body: Record<string, any> = {
    id: req.body.id || Date.now().toString(),
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    ...req.body,
  };

  // Stringify JSON columns
  (JSON_COLS[table] || []).forEach(col => {
    if (body[col] !== undefined && typeof body[col] !== 'string') {
      body[col] = JSON.stringify(body[col]);
    }
  });

  const keys = Object.keys(body);
  const values = Object.values(body);
  const cols = keys.map(k => quoteCol(table, k)).join(', ');
  const placeholders = keys.map(() => '?').join(', ');

  try {
    await pool.query(`INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`, values);
    res.status(201).json(body);
  } catch (err: any) {
    console.error(`POST /api/${table} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/:collection/:id ────────────────────────────────────────────────
app.put('/api/:collection/:id', async (req: Request, res: Response) => {
  const table = req.params.collection;
  const id = req.params.id;
  if (!TABLES.includes(table)) return res.status(400).json({ error: 'Invalid collection' });

  const body: Record<string, any> = { ...req.body };
  delete body.id;
  delete body.createdAt;

  (JSON_COLS[table] || []).forEach(col => {
    if (body[col] !== undefined && typeof body[col] !== 'string') {
      body[col] = JSON.stringify(body[col]);
    }
  });

  const keys = Object.keys(body);
  const values = Object.values(body);
  if (keys.length === 0) return res.status(400).json({ error: 'Nothing to update' });

  const setClause = keys.map(k => `${quoteCol(table, k)} = ?`).join(', ');

  try {
    await pool.query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, [...values, id]);
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
    const row = parseJsonCols(table, rows as any[])[0];
    res.json(row || { success: true });
  } catch (err: any) {
    console.error(`PUT /api/${table}/${id} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/:collection/:id ─────────────────────────────────────────────
app.delete('/api/:collection/:id', async (req: Request, res: Response) => {
  const table = req.params.collection;
  const id = req.params.id;
  if (!TABLES.includes(table)) return res.status(400).json({ error: 'Invalid collection' });

  try {
    await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`DELETE /api/${table}/${id} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Stay Subed backend running on http://localhost:${port}`);
  console.log(`📦 Connected to MySQL database: mihirabc`);
});
