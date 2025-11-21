import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../db/migrations'
);

const GUARDED_TABLES = {
  '016_20251118_create_financial_kpis.sql': ['financial_kpis'],
};

const readSqlFiles = () => {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 알파벳 순=타임스탬프 순
  return files.map((f) => ({
    name: f,
    sql: fs.readFileSync(path.join(migrationsDir, f), 'utf8'),
  }));
};

const ensureMeta = async (conn) => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS applied_migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const appliedSet = async (conn) => {
  const [rows] = await conn.query(`SELECT name FROM applied_migrations`);
  return new Set(rows.map((r) => r.name));
};

const tableExists = async (conn, table) => {
  const [rows] = await conn.query(`SHOW TABLES LIKE ?`, [table]);
  return rows.length > 0;
};

const applyOne = async (conn, name, sql, alreadyApplied = false) => {
  await conn.beginTransaction();
  try {
    await conn.query(sql);
    if (alreadyApplied) {
      await conn.query(`UPDATE applied_migrations SET applied_at = CURRENT_TIMESTAMP WHERE name = ?`, [name]);
    } else {
      await conn.query(`INSERT INTO applied_migrations (name) VALUES (?)`, [name]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error(`✖ ${name}: ${e.message}`);
    process.exit(1);
  }
};

export const runMigrations = async () => {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    multipleStatements: true,
    charset: 'utf8mb4',
  });
  try {
    await ensureMeta(conn);
    const done = await appliedSet(conn);
    for (const { name, sql } of readSqlFiles()) {
      const guardTables = GUARDED_TABLES[name] || [];
      let shouldRun = !done.has(name);
      const alreadyApplied = done.has(name);

      if (!shouldRun && guardTables.length > 0) {
        const missingTable = await Promise.all(
          guardTables.map(async (table) => ({ table, exists: await tableExists(conn, table) }))
        );
        const hasMissing = missingTable.some((t) => !t.exists);
        if (hasMissing) shouldRun = true;
      }

      if (!shouldRun) {
        console.log(`[Migration] Skipping ${name}, already applied`);
        continue;
      }

      console.log(`[Migration] Executing ${name}`);
      await applyOne(conn, name, sql, alreadyApplied);
      console.log(`[Migration] Completed ${name}`);
    }
    console.log('[Migration] All migrations up-to-date.');
  } finally {
    await conn.end();
  }
};

export default runMigrations;

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
