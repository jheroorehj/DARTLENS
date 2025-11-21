// 정규화 + KPI 통합 인사이트 제공

import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getInsightsV2, syncInsights, syncNonFinancialData } from '../services/insightsV2.js';

const router = Router();
router.use(requireAuth);

/**
 * Convert BigInt values to strings for JSON serialization
 */
function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      converted[key] = convertBigIntToString(obj[key]);
    }
    return converted;
  }
  return obj;
}

/**
 * GET /api/insights/:corp_code
 *
 * V2.0 인사이트 조회:
 * - N개년 재무데이터 자동 정규화 (18개 핵심 계정)
 * - 9개 KPI 자동 계산 (재무 6개 + 비재무 3개)
 * - reprt='auto'면 우선순위 자동 선택 (11014>11013>11012>11011)
 *
 * Query Parameters:
 * - years: 조회할 연도 수 (기본 5, 최대 10)
 * - years_list: 콤마로 구분된 연도 목록 (예: '2021,2022,2023')
 * - reprt: 보고서 코드 ('auto' 또는 '11011'~'11014')
 * - fs: 재무제표 구분 ('CFS' 또는 'OFS')
 *
 * Response:
 * {
 *   corp_code, corp_name, stock_code, listed,
 *   snapshots: [{ year, reprt_code, financials, kpis, metadata }],
 *   summary: { totalYears, yearsWithData, avgKpisCalculated }
 * }
 */
router.get('/:corp_code', async (req, res) => {
  try {
    const { corp_code } = req.params;
    const years = Math.min(10, Math.max(1, Number(req.query.years || 5)));
    const years_list = req.query.years_list || null;
    const reprt = String(req.query.reprt || 'auto');
    const fs = String(req.query.fs || 'CFS');

    console.log(`[InsightsV2] Received request for corp_code=${corp_code}`);
    console.log(`[Insights V2 API] GET /${corp_code}?years=${years}&reprt=${reprt}&fs=${fs}`);

    const insights = await getInsightsV2({ corp_code, years, reprt, fs, years_list });
    const safeInsights = convertBigIntToString(insights);

    res.json(safeInsights);
  } catch (error) {
    console.error('[Insights V2 API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INSIGHTS_ERROR'
    });
  }
});

/**
 * POST /api/insights/v2/sync
 * 전체 인사이트 동기화: 원시 재무 → 정규화 → KPI 계산 → DB 캐시 저장
 */
router.post('/sync', async (req, res) => {
  try {
    const { corp_code, years = 5, reprt = 'auto', fs = 'CFS', years_list = null } = req.body || {};

    if (!corp_code) {
      return res.status(400).json({
        success: false,
        error: 'corp_code는 필수입니다.',
        code: 'INVALID_PARAMETERS'
      });
    }

    await syncInsights(corp_code, years, reprt, fs, years_list);
    const refreshed = await getInsightsV2({ corp_code, years, reprt, fs, years_list });

    res.json(convertBigIntToString(refreshed));
  } catch (error) {
    console.error('[Insights V2 API] Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SYNC_ERROR'
    });
  }
});

/**
 * POST /api/insights/sync/non-financial
 *
 * V2.0 비재무 데이터 동기화:
 * - Risk Events (부도/회생/감사의견/소송)
 * - Governance Data (대주주 현황)
 * - Dividend Data (배당금)
 *
 * Request Body:
 * { corp_code: string, years?: number, years_list?: string[]|string }
 *
 * Response:
 * {
 *   riskData: [{corpCode, bsnsYear, riskScore, eventCount}],
 *   governanceData: [{corpCode, bsnsYear, governanceScore, majorShareholderCount}],
 *   dividendData: [{corpCode, bsnsYear, dps, dividendYield, payoutRatio}],
 *   summary: { totalYears, riskYears, governanceYears, dividendYears }
 * }
 */
router.post('/sync/non-financial', async (req, res) => {
  try {
    const { corp_code, years = 5 } = req.body;

    if (!corp_code) {
      return res.status(400).json({
        success: false,
        error: 'corp_code는 필수입니다.',
        code: 'INVALID_PARAMETERS'
      });
    }

    console.log(`[Insights V2 API] POST /sync/non-financial for ${corp_code} (${years} years)`);

    const result = await syncNonFinancialData(corp_code, years);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Insights V2 API] Sync non-financial error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SYNC_NON_FINANCIAL_ERROR'
    });
  }
});

export default router;
