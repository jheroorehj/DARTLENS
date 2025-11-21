import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

import { getFnlttSinglAcntAll } from './dartService.js';
import { extractAndNormalizeFinancials, extractIssuedShares } from './normalization.js';
import { calculateMultiYearKPIs } from './kpi.js';

// Risk and Governance scores are now calculated automatically in KPI service
// Dividend data fetching is handled separately if needed
import { upsertFinancials } from './ingestReports.js';

const NORMALIZED_ACCOUNT_FIELDS = [
  { key: 'revenue', name: 'Normalized Revenue' },
  { key: 'operating_profit', name: 'Normalized Operating Profit' },
  { key: 'net_income', name: 'Normalized Net Income' },
  { key: 'total_assets', name: 'Normalized Total Assets' },
  { key: 'total_liabilities', name: 'Normalized Total Liabilities' },
  { key: 'total_equity', name: 'Normalized Total Equity' },
  { key: 'current_assets', name: 'Normalized Current Assets' },
  { key: 'current_liabilities', name: 'Normalized Current Liabilities' },
  { key: 'non_current_assets', name: 'Normalized Non-current Assets' },
  { key: 'non_current_liabilities', name: 'Normalized Non-current Liabilities' },
  { key: 'inventory', name: 'Normalized Inventory' },
  { key: 'accounts_receivable', name: 'Normalized Accounts Receivable' },
  { key: 'accounts_payable', name: 'Normalized Accounts Payable' },
  { key: 'cash', name: 'Normalized Cash and Cash Equivalents' },
  { key: 'operating_cash_flow', name: 'Normalized Operating Cash Flow' },
  { key: 'investing_cash_flow', name: 'Normalized Investing Cash Flow' },
  { key: 'financing_cash_flow', name: 'Normalized Financing Cash Flow' },
  { key: 'depreciation', name: 'Normalized Depreciation' }
];

const REPRT_PRIORITY = ['11014', '11013', '11012', '11011'];

function latestFiscalYear() {
  const now = new Date();
  return now.getMonth() <= 2 ? now.getFullYear() - 1 : now.getFullYear();
}

function buildYears(n = 5) {
  const last = latestFiscalYear();
  const k = Math.max(1, Math.min(10, Number(n) || 5));
  return Array.from({ length: k }, (_, i) => last - (k - 1) + i);
}

function parseYearsList(yearsListInput) {
  if (Array.isArray(yearsListInput)) return yearsListInput;
  if (typeof yearsListInput !== 'string') return null;

  const trimmed = yearsListInput
    .split(',')
    .map(y => y.trim())
    .filter(Boolean);

  return trimmed.length ? trimmed : null;
}

function resolveYearsList(years, yearsListInput) {
  const parsed = parseYearsList(yearsListInput);

  if (parsed) {
    const normalized = parsed
      .map(y => Number(y))
      .filter(y => Number.isFinite(y))
      .map(String);

    const uniqueSorted = Array.from(new Set(normalized)).sort();
    if (uniqueSorted.length) {
      return uniqueSorted;
    }
  }

  return buildYears(years).map(String);
}

function normalizedAccountId(key) {
  return `NORM_${key.toUpperCase()}`;
}

function toBigIntOrNull(value) {
  if (value === null || value === undefined) return null;
  try {
    const cleaned = typeof value === 'string' ? value.replace(/,/g, '') : value;
    if (cleaned === '') return null;
    if (typeof cleaned === 'bigint') return cleaned;
    if (typeof cleaned === 'number') {
      if (!Number.isFinite(cleaned)) return null;
      return BigInt(Math.trunc(cleaned));
    }
    return BigInt(cleaned);
  } catch {
    return null;
  }
}

/* ---------------------------------------------
 * FETCH & NORMALIZE (Single & Multi-year)
 * -------------------------------------------*/

async function fetchAndNormalizeYear(corpCode, year, fs = 'CFS', reprt = 'auto', { includeRaw = false } = {}) {
  try {
    let api = null;
    let usedReprt = null;

    if (reprt === 'auto') {
      for (const code of REPRT_PRIORITY) {
        try {
          const res = await getFnlttSinglAcntAll({
            corp_code: corpCode,
            bsns_year: year,
            reprt_code: code,
            fs_div: fs
          });

          if (res?.status === '013' || !res?.list?.length) continue;

          api = res;
          usedReprt = code;
          break;
        } catch {
          continue;
        }
      }
    } else {
      try {
        const res = await getFnlttSinglAcntAll({
          corp_code: corpCode,
          bsns_year: year,
          reprt_code: reprt,
          fs_div: fs
        });
        if (res?.list?.length) {
          api = res;
          usedReprt = reprt;
        }
      } catch {}
    }

    if (!api) {
      return {
        year,
        reprt_code: null,
        normalized: null,
        metadata: { error: 'No data available' },
        raw: includeRaw ? null : undefined
      };
    }

    const normalized = await extractAndNormalizeFinancials(api);

    if (normalized) {
      try {
        normalized.issued_shares = await extractIssuedShares(corpCode, year, usedReprt);
      } catch {
        normalized.issued_shares = null;
      }
    }

    return {
      year,
      reprt_code: usedReprt,
      normalized,
      metadata: normalized?._metadata || {},
      raw: includeRaw ? api : undefined
    };
  } catch (err) {
    return {
      year,
      reprt_code: null,
      normalized: null,
      metadata: { error: err.message },
      raw: includeRaw ? null : undefined
    };
  }
}

async function fetchMultiYearNormalizedData(corpCode, yearsList, fs = 'CFS', reprt = 'auto', opts = {}) {
  const result = [];
  for (const y of yearsList) {
    result.push(await fetchAndNormalizeYear(corpCode, String(y), fs, reprt, opts));
  }
  return result;
}

/* ---------------------------------------------
 * DB UPSERTS
 * -------------------------------------------*/

async function saveNormalizedFinancials(corpCode, year, reprtCode, fs, normalized) {
  if (!normalized) return;

  const now = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 17);
  const tblkey = uuidv4().replace(/-/g, '');

  const [existing] = await pool.query(
    `SELECT TBLKEY FROM DL_NORMALIZED_FINANCIALS
     WHERE corp_code=? AND bsns_year=? AND reprt_code=? AND fs_div=?`,
    [corpCode, year, reprtCode, fs]
  );

  const fields = {
    revenue: normalized.revenue,
    operating_profit: normalized.operating_profit,
    net_income: normalized.net_income,
    total_assets: normalized.total_assets,
    total_liabilities: normalized.total_liabilities,
    total_equity: normalized.total_equity,
    current_assets: normalized.current_assets,
    current_liabilities: normalized.current_liabilities,
    non_current_assets: normalized.non_current_assets,
    non_current_liabilities: normalized.non_current_liabilities,
    inventory: normalized.inventory,
    accounts_receivable: normalized.accounts_receivable,
    accounts_payable: normalized.accounts_payable,
    cash: normalized.cash,
    operating_cash_flow: normalized.operating_cash_flow,
    investing_cash_flow: normalized.investing_cash_flow,
    financing_cash_flow: normalized.financing_cash_flow,
    depreciation: normalized.depreciation,
    issued_shares: normalized.issued_shares
  };

  if (existing.length) {
    const setClause = Object.keys(fields).map(k => `${k}=?`).join(', ');
    await pool.query(
      `UPDATE DL_NORMALIZED_FINANCIALS SET ${setClause}, MODIFYDATE=?
       WHERE corp_code=? AND bsns_year=? AND reprt_code=? AND fs_div=?`,
      [...Object.values(fields), now, corpCode, year, reprtCode, fs]
    );
  } else {
    const cols = Object.keys(fields).join(', ');
    const ph = Object.keys(fields).map(() => '?').join(', ');
    await pool.query(
      `INSERT INTO DL_NORMALIZED_FINANCIALS
       (TBLKEY, ADDDATE, MODIFYDATE, corp_code, bsns_year, reprt_code, fs_div, ${cols})
       VALUES (?, ?, ?, ?, ?, ?, ?, ${ph})`,
      [tblkey, now, now, corpCode, year, reprtCode, fs, ...Object.values(fields)]
    );
  }
}

async function persistNormalizedReportRows(corp, year, reprtCode, fs, normalized) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (let i = 0; i < NORMALIZED_ACCOUNT_FIELDS.length; i++) {
      const field = NORMALIZED_ACCOUNT_FIELDS[i];
      const val = normalized?.[field.key] ?? null;

      await conn.execute(
        `INSERT INTO financial_reports
         (corp_code, stock_code, corp_name, bsns_year, reprt_code, fs_div,
          account_id, account_nm, thstrm_amount, frmtrm_amount, ord, last_update)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())
         ON DUPLICATE KEY UPDATE thstrm_amount=VALUES(thstrm_amount), last_update=NOW()`,
        [
          corp.corp_code,
          corp.stock_code,
          corp.corp_name,
          year,
          reprtCode,
          fs,
          normalizedAccountId(field.key),
          field.name,
          val === null ? null : String(val),
          null,
          i + 1
        ]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function upsertFinancialKpis(corpCode, year, reprtCode, fs, kpis) {
  await pool.query(
    `INSERT INTO financial_kpis
     (corp_code, bsns_year, reprt_code, fs_div,
      roe, debt_ratio, current_ratio, operating_margin,
      revenue_growth, eps, risk_score, governance_score, dividend_per_share)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
      roe=VALUES(roe),
      debt_ratio=VALUES(debt_ratio),
      current_ratio=VALUES(current_ratio),
      operating_margin=VALUES(operating_margin),
      revenue_growth=VALUES(revenue_growth),
      eps=VALUES(eps),
      risk_score=VALUES(risk_score),
      governance_score=VALUES(governance_score),
      dividend_per_share=VALUES(dividend_per_share)`,
    [
      corpCode,
      year,
      reprtCode,
      fs,
      kpis?.roe ?? null,
      kpis?.debtRatio ?? null,
      kpis?.currentRatio ?? null,
      kpis?.operatingMargin ?? null,
      kpis?.revenueGrowth ?? null,
      kpis?.eps ?? null,
      kpis?.riskScore ?? null,
      kpis?.governanceScore ?? null,
      kpis?.dividendPerShare ?? null
    ]
  );
}

/* ---------------------------------------------
 * LOAD FROM DB (Normalized & KPI)
 * -------------------------------------------*/

function buildNormalizedMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = row.account_id?.replace('NORM_', '').toLowerCase();
    if (!key) continue;

    if (!map.has(row.bsns_year)) {
      map.set(row.bsns_year, {
        year: row.bsns_year,
        reprt_code: row.reprt_code,
        normalized: {}
      });
    }

    const entry = map.get(row.bsns_year);
    entry.normalized[key] = row.thstrm_amount == null ? null : toBigIntOrNull(row.thstrm_amount);
  }

  for (const [year, entry] of map) {
    NORMALIZED_ACCOUNT_FIELDS.forEach(f => {
      if (!(f.key in entry.normalized)) entry.normalized[f.key] = null;
    });
  }

  return map;
}

async function loadNormalizedFromDb(corpCode, yearsList, fs) {
  if (!yearsList.length) return new Map();
  const ph = yearsList.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT bsns_year, reprt_code, account_id, thstrm_amount
     FROM financial_reports
     WHERE corp_code=? AND fs_div=? AND account_id LIKE 'NORM_%'
       AND bsns_year IN (${ph})`,
    [corpCode, fs, ...yearsList]
  );

  return buildNormalizedMap(rows);
}

async function loadKpisFromDb(corpCode, yearsList, fs) {
  if (!yearsList.length) return new Map();
  const ph = yearsList.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT *
     FROM financial_kpis
     WHERE corp_code=? AND fs_div=? AND bsns_year IN (${ph})`,
    [corpCode, fs, ...yearsList]
  );

  const map = new Map();
  for (const row of rows) {
    map.set(row.bsns_year, {
      year: row.bsns_year,
      reprt_code: row.reprt_code,
      kpis: {
        roe: row.roe,
        debtRatio: row.debt_ratio,
        currentRatio: row.current_ratio,
        operatingMargin: row.operating_margin,
        revenueGrowth: row.revenue_growth,
        eps: row.eps,
        riskScore: row.risk_score,
        governanceScore: row.governance_score,
        dividendPerShare: row.dividend_per_share
      }
    });
  }
  return map;
}

/* ---------------------------------------------
 * COVERAGE CHECK
 * -------------------------------------------*/

function normalizeCoverage(yearsList, normalizedMap, kpiMap) {
  const missing = [];
  for (const y of yearsList) {
    const A = normalizedMap.get(String(y));
    const B = kpiMap.get(String(y));
    const hasNorm =
      A &&
      NORMALIZED_ACCOUNT_FIELDS.every(f => f.key in A.normalized);
    const hasKpi = Boolean(B);
    const hasEps = hasKpi && B.kpis && B.kpis.eps !== null && B.kpis.eps !== undefined;

    // EPS가 누락된 연도는 다시 동기화하여 최신값을 계산
    if (!hasNorm || !hasKpi || !hasEps) missing.push(String(y));
  }
  return missing;
}

/* ---------------------------------------------
 * BUILD RESPONSE
 * -------------------------------------------*/

function buildResponse(corp, yearsList, normalizedMap, kpiMap, fs) {
  const financials = yearsList.map(y => {
    const n = normalizedMap.get(String(y));
    const payload = {
      year: String(y),
      reprt_code: n?.reprt_code || null,
      fs_div: fs
    };
    NORMALIZED_ACCOUNT_FIELDS.forEach(f => {
      const v = n?.normalized?.[f.key];
      payload[f.key] = v == null ? null : Number(v);
    });
    return payload;
  });

  const kpis = yearsList.map(y => {
    const row = kpiMap.get(String(y));
    return {
      year: String(y),
      reprt_code: row?.reprt_code || normalizedMap.get(String(y))?.reprt_code || null,
      fs_div: fs,
      ...row?.kpis
    };
  });

  return {
    corp_code: corp.corp_code,
    corp_name: corp.corp_name,
    financials,
    kpis
  };
}

/* ---------------------------------------------
 * SYNC FULL (Normalize + KPIs)
 * -------------------------------------------*/

export async function syncInsights(corpCode, years = 5, reprt = 'auto', fs = 'CFS', yearsListInput = null) {
  console.log(`[Sync] Running full refresh for ${corpCode}`);

  const [[corpRow]] = await pool.query(
    `SELECT corp_code, corp_name, stock_code
     FROM corp_basic WHERE corp_code=? LIMIT 1`,
    [corpCode]
  );

  if (!corpRow) throw new Error(`Corp not found: ${corpCode}`);

  const yearsList = resolveYearsList(years, yearsListInput);

  const normalizedList = await fetchMultiYearNormalizedData(
    corpCode,
    yearsList,
    fs,
    reprt,
    { includeRaw: true }
  );

  for (const row of normalizedList) {
    const reprtCode = row.reprt_code || '00000';

    if (row.raw?.list?.length) {
      await upsertFinancials(corpRow, row.year, reprtCode, fs, row.raw);
    }

    await persistNormalizedReportRows(corpRow, row.year, reprtCode, fs, row.normalized);
    if (row.normalized) {
      await saveNormalizedFinancials(corpCode, row.year, reprtCode, fs, row.normalized);
    }
  }

  const kpis = await calculateMultiYearKPIs(pool, normalizedList, corpCode);
  for (let i = 0; i < kpis.length; i++) {
    const reprtCode = normalizedList[i].reprt_code || '00000';
    await upsertFinancialKpis(corpCode, normalizedList[i].year, reprtCode, fs, kpis[i].kpis);
  }

  const normalizedMap = await loadNormalizedFromDb(corpCode, yearsList, fs);
  const kpiMap = await loadKpisFromDb(corpCode, yearsList, fs);

  return { normalizedMap, kpiMap, yearsList, corp: corpRow };
}

/* ---------------------------------------------
 * GET INSIGHTS (Cache-first)
 * -------------------------------------------*/

export async function getInsightsV2({ corp_code, years = 5, reprt = 'auto', fs = 'CFS', years_list = null }) {
  try {
    const [[corpRow]] = await pool.query(
      'SELECT corp_code, corp_name FROM corp_basic WHERE corp_code = ? LIMIT 1',
      [corp_code]
    );
    if (!corpRow) throw new Error(`Corp not found: ${corp_code}`);

    const yearsList = resolveYearsList(years, years_list);

    console.log(`[InsightsV2] Received request for ${corp_code}`);
    console.log(`[Cache] Checking DB for years ${JSON.stringify(yearsList)}`);

    const normalizedMap = await loadNormalizedFromDb(corp_code, yearsList, fs);
    const kpiMap = await loadKpisFromDb(corp_code, yearsList, fs);
    const missing = normalizeCoverage(yearsList, normalizedMap, kpiMap);

    if (!missing.length) {
      console.log('[Cache] Loaded from DB (no external API call)');
      return buildResponse(corpRow, yearsList, normalizedMap, kpiMap, fs);
    }

    console.log(`[Cache] Missing years: ${missing.join(',')}. Running sync...`);
    const synced = await syncInsights(corp_code, years, reprt, fs, years_list);

    return buildResponse(
      corpRow,
      synced.yearsList,
      synced.normalizedMap,
      synced.kpiMap,
      fs
    );
  } catch (err) {
    console.error(`[InsightsV2] Error generating insights:`, err.message);
    throw err;
  }
}

/* ---------------------------------------------
 * NON-FINANCIAL SYNC
 * -------------------------------------------*/

export async function syncNonFinancialData(corpCode, years = 5) {
  try {
    const [risk, gov, div] = await Promise.all([
      fetchMultiYearRiskEvents(corpCode, years),
      fetchMultiYearGovernanceData(corpCode, years),
      fetchMultiYearDividendData(corpCode, years)
    ]);

    return {
      riskData: risk,
      governanceData: gov,
      dividendData: div,
      summary: {
        totalYears: years,
        riskYears: risk.filter(r => r.riskScore != null).length,
        governanceYears: gov.filter(r => r.governanceScore != null).length,
        dividendYears: div.filter(r => r.dps != null).length
      }
    };
  } catch (err) {
    console.error(`[InsightsV2] Error syncing non-financial data:`, err.message);
    throw err;
  }
}
