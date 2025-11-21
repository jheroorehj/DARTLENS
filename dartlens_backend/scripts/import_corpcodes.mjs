import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
};

async function importCorpCodes() {
  let connection;

  try {
    console.log('[Import] Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('[Import] Connected successfully');

    // Read JSON file
    const jsonPath = path.join(__dirname, 'corpcodes_listed.json');
    console.log(`[Import] Reading ${jsonPath}...`);

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const { items, count, generated_at } = jsonData;

    console.log(`[Import] Found ${count} listed corporations (generated at ${generated_at})`);

    // Clear existing data
    console.log('[Import] Clearing existing corp_basic data...');
    await connection.query('DELETE FROM corp_basic WHERE listed = 1');
    console.log('[Import] Existing data cleared');

    // Prepare batch insert
    const batchSize = 500;
    let inserted = 0;
    let failed = 0;

    console.log('[Import] Starting batch insert...');

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Build VALUES clause
      const values = batch.map(corp => [
        corp.corp_code,
        corp.corp_name,
        corp.stock_code || null,
        1 // listed
      ]);

      try {
        const sql = `
          INSERT INTO corp_basic (corp_code, corp_name, stock_code, listed)
          VALUES ?
          ON DUPLICATE KEY UPDATE
            corp_name = VALUES(corp_name),
            stock_code = VALUES(stock_code),
            listed = VALUES(listed)
        `;

        const [result] = await connection.query(sql, [values]);
        inserted += result.affectedRows;

        // Progress report
        const progress = Math.min(i + batchSize, items.length);
        console.log(`[Import] Progress: ${progress}/${items.length} (${((progress / items.length) * 100).toFixed(1)}%)`);
      } catch (error) {
        console.error(`[Import] Batch insert error (batch ${i / batchSize + 1}):`, error.message);
        failed += batch.length;
      }
    }

    // Final statistics
    console.log('\n[Import] ✅ Import completed!');
    console.log(`[Import] Total corporations: ${count}`);
    console.log(`[Import] Successfully inserted/updated: ${inserted}`);
    console.log(`[Import] Failed: ${failed}`);

    // Verify count
    const [[{ total }]] = await connection.query(
      'SELECT COUNT(*) as total FROM corp_basic WHERE listed = 1'
    );
    console.log(`[Import] Database verification: ${total} listed corporations`);

  } catch (error) {
    console.error('[Import] ❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('[Import] Database connection closed');
    }
  }
}

// Run import
importCorpCodes();
