import path from "path";
import { Pool as PgPool } from "pg";
import { env } from "../config/env.js";

type QueryResult = { rows: any[]; rowCount: number };
type QueryFn = (text: string, params?: any[]) => Promise<QueryResult>;

const usePostgres =
  process.env.NODE_ENV === "production" || process.env.USE_POSTGRES === "true";

let query: QueryFn;

if (usePostgres) {
  const isLocalPg =
    env.DATABASE_URL.includes("localhost") ||
    env.DATABASE_URL.includes("127.0.0.1");
  const pgPool = new PgPool({
    connectionString: env.DATABASE_URL,
    ssl: !isLocalPg && process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined
  });

  query = async (text: string, params: any[] = []) => {
    const result = await pgPool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  };
} else {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      max_searches_per_day INTEGER,
      max_leads INTEGER,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      company TEXT,
      plan_id TEXT REFERENCES plans(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      website TEXT,
      email TEXT,
      category TEXT,
      city TEXT,
      latitude REAL,
      longitude REAL,
      rating REAL,
      size TEXT,
      revenue_estimate TEXT,
      business_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query TEXT NOT NULL,
      city TEXT,
      radius_km REAL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
      company_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      website TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS lead_notes (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  let sqliteDb: any | null = null;
  let sqliteReady: Promise<void> | null = null;

  const ensureSqliteReady = async () => {
    if (sqliteReady) return sqliteReady;
    sqliteReady = (async () => {
      const sqlite3Module = await import("sqlite3");
      const sqlite3 = (sqlite3Module as any).default ?? sqlite3Module;
      const dbPath = path.resolve(process.cwd(), "mapa_b2b.sqlite");
      sqliteDb = new sqlite3.Database(dbPath);
      await new Promise<void>((resolve, reject) => {
        sqliteDb.exec(schemaSql, (err: Error | null) => {
          if (err) return reject(err);
          resolve();
        });
      });
    })();
    return sqliteReady;
  };

  query = async (text: string, params: any[] = []) => {
    await ensureSqliteReady();
    const db = sqliteDb!;

    return new Promise((resolve, reject) => {
      // In PostgreSQL, parameters are $1, $2. In SQLite, they are ?.
      const sqliteQuery = text.replace(/\$\d+/g, "?").replace(/RETURNING.*/g, "");

      const isSelect = sqliteQuery.trim().toUpperCase().startsWith("SELECT");

      if (isSelect || sqliteQuery.includes("RETURNING")) {
        db.all(sqliteQuery, params, function (err: Error | null, rows: any[]) {
          if (err) return reject(err);
          resolve({ rows: rows || [], rowCount: rows?.length || 0 });
        });
      } else {
        db.run(sqliteQuery, params, function (err: Error | null) {
          if (err) return reject(err);

          // If it was an insert with RETURNING, simulate the expected user shape.
          if (text.toUpperCase().includes("RETURNING")) {
            const normalizedText = text.trim().toUpperCase();
            const isInsertUser = normalizedText.startsWith("INSERT INTO USERS");
            if (isInsertUser && params.length >= 3) {
              resolve({
                rows: [{
                  id: params[0],
                  name: params[1],
                  email: params[2],
                  company: params[4] ?? null
                }],
                rowCount: 1
              });
              return;
            }
          }
          resolve({ rows: [], rowCount: this.changes || 0 });
        });
      }
    });
  };
}

export const pool = { query };
