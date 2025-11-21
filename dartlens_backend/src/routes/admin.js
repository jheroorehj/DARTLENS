import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// V2.0: Admin Backfill endpoint (placeholder)
// 향후 구현 예정: POST /api/admin/backfill
router.post('/backfill', async (req, res) => {
  try {
    const { corpCodes, dataTypes = ['financials', 'risk', 'governance', 'dividends'] } = req.body;

    if (!corpCodes || !Array.isArray(corpCodes) || corpCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'corpCodes 배열이 필요합니다.',
        code: 'INVALID_PARAMETERS'
      });
    }

    // TODO: Implement backfill logic
    // 1. Loop through corpCodes
    // 2. For each dataType, call DART API
    // 3. Normalize and save to DB

    res.json({
      success: true,
      data: {
        message: '백필 기능은 향후 구현 예정입니다.',
        totalCorps: corpCodes.length,
        successCorps: 0,
        failedCorps: 0,
        results: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'BACKFILL_ERROR'
    });
  }
});

// Admin stats endpoint
router.get('/stats', async (_req, res) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM DL_USER');
    const [[corpCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM corp_basic WHERE listed=1');
    const [[financialCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM DL_NORMALIZED_FINANCIALS');
    const [[riskCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM DL_RISK_EVENTS');
    const [[govCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM DL_GOVERNANCE_DATA');
    const [[divCount]] = await pool.query('SELECT COUNT(*) AS cnt FROM DL_DIVIDENDS');

    res.json({
      success: true,
      data: {
        users: userCount.cnt,
        listed_corps: corpCount.cnt,
        normalized_financials: financialCount.cnt,
        risk_events: riskCount.cnt,
        governance_data: govCount.cnt,
        dividends: divCount.cnt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STATS_ERROR'
    });
  }
});

export default router;
