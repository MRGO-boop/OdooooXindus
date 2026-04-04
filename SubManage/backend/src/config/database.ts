import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Database file path
const DB_PATH = process.env.DATABASE_PATH || './database.db';

// Initialize SQLite database
const db: DatabaseType = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase(): void {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Execute schema (split by semicolon and execute each statement)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    db.exec(statement);
  }
  
  console.log('✅ Database schema initialized');
}

// Helper function to generate unique IDs (similar to Prisma's cuid)
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to get current timestamp
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export default db;
