import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query('SELECT pg_advisory_lock(739421)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const dir = path.join(process.cwd(), 'migrations');
  const files = (await fs.readdir(dir)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of files) {
    const exists = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (exists.rowCount) continue;
    const sql = await fs.readFile(path.join(dir, name), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!existing.rowCount) {
      const salt = crypto.randomBytes(16).toString('hex');
      const key = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, value) => error ? reject(error) : resolve(value)));
      await client.query(`INSERT INTO users (id, email, password_hash, display_name, role)
        VALUES ($1, $2, $3, $4, 'editor_in_chief')`, [crypto.randomUUID(), email, `scrypt:${salt}:${key.toString('hex')}`, process.env.ADMIN_NAME || '主編']);
      console.log('Created editor-in-chief account');
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(739421)').catch(() => undefined);
  client.release();
  await pool.end();
}
