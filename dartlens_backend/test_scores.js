import 'dotenv/config';
import pool from './src/db.js';
import { calculateAndSaveRiskScore } from './src/services/risk.js';
import { calculateAndSaveGovernanceScore } from './src/services/governance.js';

async function testScoreCalculation() {
  try {
    console.log('=== Testing Risk and Governance Score Calculation ===\n');

    // Get normalized financial data for Samsung (00126380) 2023
    const [rows] = await pool.query(
      `SELECT * FROM DL_NORMALIZED_FINANCIALS
       WHERE corp_code = ? AND bsns_year = ?
       ORDER BY MODIFYDATE DESC LIMIT 1`,
      ['00126380', '2023']
    );

    if (rows.length === 0) {
      console.log('No financial data found for Samsung 2023');
      process.exit(1);
    }

    const normalized = rows[0];
    console.log('Found normalized financial data for Samsung 2023');
    console.log(`Revenue: ${normalized.revenue}`);
    console.log(`Total Assets: ${normalized.total_assets}`);
    console.log(`Total Equity: ${normalized.total_equity}`);
    console.log(`\n---\n`);

    // Test Risk Score calculation
    console.log('Testing Risk Score calculation...');
    const riskResult = await calculateAndSaveRiskScore('00126380', '2023', normalized);
    console.log('Risk Score Result:', riskResult);
    console.log();

    // Test Governance Score calculation
    console.log('Testing Governance Score calculation...');
    const govResult = await calculateAndSaveGovernanceScore('00126380', '2023', normalized);
    console.log('Governance Score Result:', govResult);
    console.log();

    // Verify data was saved to DB
    console.log('=== Verifying Scores in Database ===\n');

    const [riskRows] = await pool.query(
      'SELECT corp_code, bsns_year, risk_score, MODIFYDATE FROM DL_RISK_EVENTS WHERE corp_code = ? AND bsns_year = ?',
      ['00126380', '2023']
    );
    console.log('Risk Score in DB:', riskRows);

    const [govRows] = await pool.query(
      'SELECT corp_code, bsns_year, governance_score, MODIFYDATE FROM DL_GOVERNANCE_DATA WHERE corp_code = ? AND bsns_year = ?',
      ['00126380', '2023']
    );
    console.log('Governance Score in DB:', govRows);

    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testScoreCalculation();
