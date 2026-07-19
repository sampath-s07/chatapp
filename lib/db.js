const { Pool } = require('pg');

let pool;
let schemaReady = false;

async function getDb() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set!');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase ALWAYS requires SSL â€” do not conditionally disable
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      max: 10,
    });

    // Test connection immediately so we catch errors early
    try {
      await pool.query('SELECT 1');
      console.log('âœ… PostgreSQL connected successfully');
    } catch (err) {
      console.error('âŒ PostgreSQL connection failed:', err.message);
      pool = null;
      throw err;
    }
  }

  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }

  return pool;
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar_color VARCHAR(50) DEFAULT '#00a884',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('âœ… Database schema initialized');
}

module.exports = { getDb };
