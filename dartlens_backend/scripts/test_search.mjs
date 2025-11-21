import pool from '../src/db.js';

async function testSearch() {
  try {
    // Test 1: Check total count
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM corp_basic WHERE listed = 1'
    );
    console.log(`✅ Total listed corporations: ${total}`);

    // Test 2: Search for "삼성"
    const [samsung] = await pool.query(
      `SELECT corp_name, corp_code, stock_code
       FROM corp_basic
       WHERE listed=1 AND corp_name LIKE '%삼성%'
       LIMIT 10`
    );
    console.log(`\n✅ Search results for "삼성": ${samsung.length} found`);
    samsung.forEach((corp, i) => {
      console.log(`  ${i + 1}. ${corp.corp_name} (${corp.corp_code}, ${corp.stock_code})`);
    });

    // Test 3: Search for "현대"
    const [hyundai] = await pool.query(
      `SELECT corp_name, corp_code, stock_code
       FROM corp_basic
       WHERE listed=1 AND corp_name LIKE '%현대%'
       LIMIT 10`
    );
    console.log(`\n✅ Search results for "현대": ${hyundai.length} found`);
    hyundai.forEach((corp, i) => {
      console.log(`  ${i + 1}. ${corp.corp_name} (${corp.corp_code}, ${corp.stock_code})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testSearch();
