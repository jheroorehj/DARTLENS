// 9개 핵심 지표 계산 (6개 재무 KPI + 3개 비재무 지표)

/**
 * 6개 재무 KPI 계산
 *
 * @param {Object} normalized - 정규화된 재무데이터 (18개 계정)
 * @param {Object} previousYearNormalized - 전년도 정규화 데이터 (성장률 계산용)
 * @returns {Object} 6개 재무 KPI
 */
export function calculateFinancialKPIs(normalized, previousYearNormalized = null) {
  const kpis = {
    roe: null,              // 자기자본이익률 (%)
    debtRatio: null,        // 부채비율 (%)
    currentRatio: null,     // 유동비율 (%)
    operatingMargin: null,  // 영업이익률 (%)
    revenueGrowth: null,    // 매출성장률 (%)
    eps: null               // 주당순이익 (원)
  };

  if (!normalized) {
    console.warn('[KPI] No normalized data provided');
    return kpis;
  }

  // 1. ROE = (당기순이익 / 자본총계) × 100
  if (normalized.net_income !== null && normalized.total_equity !== null && normalized.total_equity !== 0n) {
    try {
      const roe = (Number(normalized.net_income) / Number(normalized.total_equity)) * 100;
      kpis.roe = parseFloat(roe.toFixed(2));
    } catch (error) {
      console.error('[KPI] ROE calculation error:', error.message);
    }
  }

  // 2. Debt Ratio = (부채총계 / 자본총계) × 100
  if (normalized.total_liabilities !== null && normalized.total_equity !== null && normalized.total_equity !== 0n) {
    try {
      const debtRatio = (Number(normalized.total_liabilities) / Number(normalized.total_equity)) * 100;
      kpis.debtRatio = parseFloat(debtRatio.toFixed(2));
    } catch (error) {
      console.error('[KPI] Debt Ratio calculation error:', error.message);
    }
  }

  // 3. Current Ratio = (유동자산 / 유동부채) × 100
  if (normalized.current_assets !== null && normalized.current_liabilities !== null && normalized.current_liabilities !== 0n) {
    try {
      const currentRatio = (Number(normalized.current_assets) / Number(normalized.current_liabilities)) * 100;
      kpis.currentRatio = parseFloat(currentRatio.toFixed(2));
    } catch (error) {
      console.error('[KPI] Current Ratio calculation error:', error.message);
    }
  }

  // 4. Operating Margin = (영업이익 / 매출액) × 100
  if (normalized.operating_profit !== null && normalized.revenue !== null && normalized.revenue !== 0n) {
    try {
      const operatingMargin = (Number(normalized.operating_profit) / Number(normalized.revenue)) * 100;
      kpis.operatingMargin = parseFloat(operatingMargin.toFixed(2));
    } catch (error) {
      console.error('[KPI] Operating Margin calculation error:', error.message);
    }
  }

  // 5. Revenue Growth = ((당년 매출 - 전년 매출) / 전년 매출) × 100
  if (previousYearNormalized &&
      normalized.revenue !== null &&
      previousYearNormalized.revenue !== null &&
      previousYearNormalized.revenue !== 0n) {
    try {
      const revenueGrowth = ((Number(normalized.revenue) - Number(previousYearNormalized.revenue)) / Number(previousYearNormalized.revenue)) * 100;
      kpis.revenueGrowth = parseFloat(revenueGrowth.toFixed(2));
    } catch (error) {
      console.error('[KPI] Revenue Growth calculation error:', error.message);
    }
  }

  // 6. EPS = 당기순이익 / 발행주식수
  // ⚠️ Note: issued_shares는 DL_NORMALIZED_FINANCIALS에서 가져와야 함
  if (normalized.net_income !== null && normalized.issued_shares !== null && normalized.issued_shares !== 0n) {
    try {
      const eps = Number(normalized.net_income) / Number(normalized.issued_shares);
      kpis.eps = parseFloat(eps.toFixed(2));
    } catch (error) {
      console.error('[KPI] EPS calculation error:', error.message);
    }
  } else if (normalized.basic_eps !== undefined && normalized.basic_eps !== null) {
    // DART 재무제표에 기재된 기본주당이익 값 활용 (발행주식수 API 실패 시)
    try {
      const eps = Number(normalized.basic_eps);
      if (Number.isFinite(eps)) {
        kpis.eps = parseFloat(eps.toFixed(2));
      }
    } catch (error) {
      console.error('[KPI] EPS fallback (basic_eps) error:', error.message);
    }
  }

  return kpis;
}

/**
 * 비재무 지표 계산 및 조회 (Risk, Governance, Dividend)
 *
 * @param {Object} pool - MySQL connection pool
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @param {Object} normalized - 정규화된 재무데이터 (Risk/Governance 계산용)
 * @returns {Object} 3개 비재무 지표
 */
export async function fetchNonFinancialMetrics(pool, corpCode, bsnsYear, normalized = null) {
  const metrics = {
    riskScore: null,         // 리스크 점수 (0-100, 높을수록 안전)
    governanceScore: null,   // 거버넌스 점수 (0-10)
    dividendPerShare: null   // 주당배당금 (원)
  };

  try {
    // 1. Risk Score 계산 및 저장 (재무 데이터 기반)
    if (normalized) {
      const { calculateAndSaveRiskScore } = await import('./risk.js');
      const riskResult = await calculateAndSaveRiskScore(corpCode, bsnsYear, normalized);
      metrics.riskScore = riskResult.riskScore;
    } else {
      // DB에서 조회만
      const [riskRows] = await pool.query(
        'SELECT risk_score FROM DL_RISK_EVENTS WHERE corp_code = ? AND bsns_year = ? ORDER BY MODIFYDATE DESC LIMIT 1',
        [corpCode, bsnsYear]
      );
      if (riskRows.length > 0) {
        metrics.riskScore = riskRows[0].risk_score;
      }
    }

    // 2. Governance Score 계산 및 저장 (재무 데이터 기반)
    if (normalized) {
      const { calculateAndSaveGovernanceScore } = await import('./governance.js');
      const govResult = await calculateAndSaveGovernanceScore(corpCode, bsnsYear, normalized);
      metrics.governanceScore = govResult.governanceScore;
    } else {
      // DB에서 조회만
      const [govRows] = await pool.query(
        'SELECT governance_score FROM DL_GOVERNANCE_DATA WHERE corp_code = ? AND bsns_year = ? ORDER BY MODIFYDATE DESC LIMIT 1',
        [corpCode, bsnsYear]
      );
      if (govRows.length > 0) {
        metrics.governanceScore = govRows[0].governance_score;
      }
    }

    // 3. Dividend Per Share (DL_DIVIDENDS에서 해당 연도 주당배당금 조회)
    const [divRows] = await pool.query(
      'SELECT dps FROM DL_DIVIDENDS WHERE corp_code = ? AND bsns_year = ? LIMIT 1',
      [corpCode, bsnsYear]
    );
    if (divRows.length > 0) {
      metrics.dividendPerShare = divRows[0].dps ? Number(divRows[0].dps) : null;
    }
  } catch (error) {
    console.error('[KPI] Non-financial metrics fetch error:', error.message);
  }

  return metrics;
}

/**
 * 전체 9개 KPI 계산 (재무 6개 + 비재무 3개)
 *
 * @param {Object} pool - MySQL connection pool
 * @param {Object} normalized - 정규화된 재무데이터
 * @param {Object} previousYearNormalized - 전년도 정규화 데이터
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @returns {Object} 9개 KPI
 */
export async function calculateAllKPIs(pool, normalized, previousYearNormalized, corpCode, bsnsYear) {
  // 재무 KPI 계산
  const financialKPIs = calculateFinancialKPIs(normalized, previousYearNormalized);

  // 비재무 지표 계산 및 조회 (normalized 전달하여 자동 계산)
  const nonFinancialMetrics = await fetchNonFinancialMetrics(pool, corpCode, bsnsYear, normalized);

  // 전체 9개 KPI 반환
  return {
    // Financial KPIs (6)
    roe: financialKPIs.roe,
    debtRatio: financialKPIs.debtRatio,
    currentRatio: financialKPIs.currentRatio,
    operatingMargin: financialKPIs.operatingMargin,
    revenueGrowth: financialKPIs.revenueGrowth,
    eps: financialKPIs.eps,

    // Non-Financial Metrics (3)
    riskScore: nonFinancialMetrics.riskScore,
    governanceScore: nonFinancialMetrics.governanceScore,
    dividendPerShare: nonFinancialMetrics.dividendPerShare
  };
}

/**
 * 5개년 KPI 계산 (성장률 포함)
 *
 * @param {Object} pool - MySQL connection pool
 * @param {Array} normalizedDataArray - 5개년 정규화 데이터 배열 [{year, normalized}, ...]
 * @param {string} corpCode - 기업 코드
 * @returns {Array} 5개년 KPI 배열
 */
export async function calculateMultiYearKPIs(pool, normalizedDataArray, corpCode) {
  const multiYearKPIs = [];

  for (let i = 0; i < normalizedDataArray.length; i++) {
    const { year, normalized } = normalizedDataArray[i];

    // 전년도 데이터 (성장률 계산용)
    const previousYearNormalized = i > 0 ? normalizedDataArray[i - 1].normalized : null;

    // 9개 KPI 계산
    const kpis = await calculateAllKPIs(pool, normalized, previousYearNormalized, corpCode, year);

    multiYearKPIs.push({
      year,
      kpis,
      _metadata: {
        hasFinancialData: normalized !== null,
        hasPreviousYearData: previousYearNormalized !== null,
        calculatedKPIs: Object.values(kpis).filter(v => v !== null).length
      }
    });
  }

  console.log(`[KPI] Calculated KPIs for ${multiYearKPIs.length} years for corp_code=${corpCode}`);
  return multiYearKPIs;
}
