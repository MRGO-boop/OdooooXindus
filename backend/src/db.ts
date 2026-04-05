import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: 'localhost',
  port: 3306,
  database: 'mihirabc',
  user: 'root',
  password: '',          // XAMPP default has no password
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
