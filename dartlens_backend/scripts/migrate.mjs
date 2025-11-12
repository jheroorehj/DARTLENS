// scripts/migrate.mjs
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const dir = './db/migrations';

const readSqlFiles = () => {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // 알파벳 순=타임스탬프 순
  return files.map(f => ({ name: f, sql: fs.readFileSync(path.join(dir, f), 'utf8') }));
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
  return new Set(rows.map(r => r.name));
};

const applyOne = async (conn, name, sql) => {
  await conn.beginTransaction();
  try {
    await conn.query(sql);
    await conn.query(`INSERT INTO applied_migrations (name) VALUES (?)`, [name]);
    await conn.commit();
    console.log(`✔ ${name}`);
  } catch (e) {
    await conn.rollback();
    console.error(`✖ ${name}: ${e.message}`);
    process.exit(1);
  }
};

const main = async () => {
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
      if (!done.has(name)) await applyOne(conn, name, sql);
    }
    console.log('All migrations up-to-date.');
  } finally {
    await conn.end();
  }
};

main().catch(e => { console.error(e); process.exit(1); });
