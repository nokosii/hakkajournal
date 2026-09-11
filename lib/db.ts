import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool, type QueryResultRow } from 'pg';
import type { PGlite } from '@electric-sql/pglite';
import { executeGoogleStoreQuery, googleStoreConfigured } from '@/lib/google-store';

declare global {
  // eslint-disable-next-line no-var
  var __jhdhPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __jhdhLocalDatabase: Promise<PGlite> | undefined;
}

export function databaseConfigured() {
  return true;
}

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('遠端 PostgreSQL 尚未設定');
  if (!global.__jhdhPool) {
    global.__jhdhPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return global.__jhdhPool;
}

async function getLocalDatabase() {
  if (!global.__jhdhLocalDatabase) {
    global.__jhdhLocalDatabase = (async () => {
      const { PGlite } = await import('@electric-sql/pglite');
      const dataRoot = path.resolve(process.cwd(), '.data');
      await fs.mkdir(dataRoot, { recursive: true });
      const database = await PGlite.create(path.join(dataRoot, 'jhdh-pglite'));
      const migrationsDirectory = path.resolve(process.cwd(), 'migrations');
      const migrations = (await fs.readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort();
      for (const migrationName of migrations) {
        await database.exec(await fs.readFile(path.join(migrationsDirectory, migrationName), 'utf8'));
      }
      return database;
    })();
  }
  return global.__jhdhLocalDatabase;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
  if (googleStoreConfigured()) return executeGoogleStoreQuery<T>(text, values);
  if (process.env.DATABASE_URL) {
    const result = await getPool().query<T>(text, values);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  }

  const database = await getLocalDatabase();
  const result = await database.query<T>(text, values);
  return { rows: result.rows, rowCount: result.rowCount ?? result.affectedRows ?? 0 };
}
