function normalizeLinear(value, min, max, outMin = 0, outMax = 10, invert = false) {
  if (value === null || value === undefined) return outMin;

  const clamped = Math.max(min, Math.min(max, value));
  const normalized = ((clamped - min) / (max - min)) * (outMax - outMin) + outMin;

  const minOut = Math.min(outMin, outMax);
  const maxOut = Math.max(outMin, outMax);
  const clampedOutput = Math.max(minOut, Math.min(maxOut, normalized));

  return invert ? outMin + outMax - clampedOutput : clampedOutput;
}

function toSafeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function calculateGrowthRate(series = [], fallbackLatest = null) {
  if (!Array.isArray(series) || series.length < 2) return 0;

  const numericSeries = series.map(Number).filter((v) => Number.isFinite(v));
  if (numericSeries.length < 2) return 0;

  const first = numericSeries[0];
  const last = numericSeries[numericSeries.length - 1];

  // CAGR works only when 시계열이 같은 부호를 유지할 때 안정적으로 계산됨
  // EPS가 적자→흑자로 전환되는 경우 0%로 처리되던 문제를 피하기 위해 보정
  const signChanged = Math.sign(first) !== Math.sign(last) || first === 0 || last === 0;
  if (signChanged) {
    const baseline = Math.max(Math.abs(first), Math.abs(last), 1);
    return ((last - first) / baseline) * 100;
  }

  const periods = numericSeries.length - 1;
  const cagr = (last / first) ** (1 / periods) - 1;
  return Number.isFinite(cagr) ? cagr * 100 : 0;
}

function calculateVolatility(series = []) {
  if (!Array.isArray(series) || series.length < 2) return 0;

  const finiteSeries = series.map(Number).filter((v) => Number.isFinite(v));
  if (finiteSeries.length < 2) return 0;

  const avg = finiteSeries.reduce((sum, v) => sum + v, 0) / finiteSeries.length;
  const avgAbs = finiteSeries.reduce((sum, v) => sum + Math.abs(v), 0) / finiteSeries.length;
  if (avgAbs === 0) return 0;

  const variance = finiteSeries.reduce((sum, v) => sum + (v - avg) ** 2, 0) / finiteSeries.length;
  const stddev = Math.sqrt(variance);
  return Math.abs(stddev / avgAbs);
}

function hasPositiveDividend(series = [], latestValue = null) {
  const values = Array.isArray(series) ? [...series] : [];

  if (Number.isFinite(latestValue)) {
    values.push(Number(latestValue));
  }

  return values.some((value) => Number.isFinite(value) && value > 0);
}

function getKpiValue(entry, key) {
  if (!entry) return null;
  if (entry[key] !== null && entry[key] !== undefined) return entry[key];
  if (entry.kpis && entry.kpis[key] !== null && entry.kpis[key] !== undefined) return entry.kpis[key];
  return null;
}

function getRecentSeries(history, key, limit = 5) {
  if (!Array.isArray(history)) return [];

  const values = [];
  for (let i = history.length - 1; i >= 0 && values.length < limit; i--) {
    const value = getKpiValue(history[i], key);
    const num = Number(value);
    if (Number.isFinite(num)) {
      values.unshift(num); // Preserve chronological order (oldest → latest)
    }
  }
  return values;
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  if (q <= 0) return sorted[0];
  if (q >= 1) return sorted[sorted.length - 1];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
}

function winsorizeValue(value, group, p = 0.05) {
  const sorted = [...group].sort((a, b) => a - b);
  const lower = quantile(sorted, p);
  const upper = quantile(sorted, 1 - p);
  const clamp = (v) => Math.min(Math.max(v, lower), upper);
  return { value: clamp(value), lower, upper };
}

function percentileRank(value, group) {
  if (!group.length) return 0;
  const sorted = [...group].sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) {
    if (v <= value) count += 1;
    else break;
  }
  return count / sorted.length;
}

function normalizeCrossSection(value, group = [], options = {}) {
  const {
    method = 'percentile',
    fallbackMin = 0,
    fallbackMax = 1,
    invert = false,
    scale = 1,
    minSamples = 15,
  } = options;

  const finiteGroup = (Array.isArray(group) ? group : [])
    .map(Number)
    .filter((v) => Number.isFinite(v));
  const finiteValue = Number(value);

  if (!Number.isFinite(finiteValue)) return 0;

  let score;
  if (finiteGroup.length >= minSamples && new Set(finiteGroup).size > 1) {
    const { value: wzValue } = winsorizeValue(finiteValue, finiteGroup);
    const winsorized = finiteGroup.map((v) => winsorizeValue(v, finiteGroup).value);

    if (method === 'z') {
      const median = quantile([...winsorized].sort((a, b) => a - b), 0.5);
      const mean = winsorized.reduce((sum, v) => sum + v, 0) / winsorized.length;
      const variance = winsorized.reduce((sum, v) => sum + (v - mean) ** 2, 0) / winsorized.length;
      const std = Math.sqrt(variance) || 1;
      const z = (wzValue - median) / std;
      score = Math.max(0, Math.min(10, 5 + z * scale));
    } else {
      const perc = percentileRank(wzValue, winsorized);
      score = Math.max(0, Math.min(10, perc * 10));
    }
  } else {
    score = normalizeLinear(finiteValue, fallbackMin, fallbackMax, 0, 10);
  }

  return invert ? 10 - score : score;
}

function collectCrossSection(history = [], key) {
  return history
    .map((row) => getKpiValue(row, key))
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
}

function transformValue(value, mode = 'none') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  switch (mode) {
    case 'logPercent':
      return Math.log1p(numeric / 100);
    case 'logAbsolute':
      return Math.sign(numeric) * Math.log1p(Math.abs(numeric));
    default:
      return numeric;
  }
}

function computeWeightedSlope(values, weights) {
  const n = values.length;
  if (n < 2) return 0;

  const x = values.map((_, idx) => idx + 1);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const meanX = x.reduce((sum, xi, idx) => sum + xi * weights[idx], 0) / weightSum;
  const meanY = values.reduce((sum, yi, idx) => sum + yi * weights[idx], 0) / weightSum;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const wi = weights[i];
    numerator += wi * (x[i] - meanX) * (values[i] - meanY);
    denominator += wi * (x[i] - meanX) ** 2;
  }

  return denominator !== 0 ? numerator / denominator : 0;
}

function computeLevelAndTrend(history, key, latestValue, { transform = 'none', limit = 3 } = {}) {
  // 최근 limit개 시계열만 가져오기
  const series = getRecentSeries(history, key, limit);
  const seriesWithLatest = [...series];

  const candidate = Number(latestValue);
  if (Number.isFinite(candidate)) {
    if (seriesWithLatest.length === 0) seriesWithLatest.push(candidate);
    else seriesWithLatest[seriesWithLatest.length - 1] = candidate;
  }

  if (seriesWithLatest.length === 0) return { level: 0, trend: 0, usedSeries: [] };

  // 가중치 계산 (최근일수록 더 큰 가중치)
  const weights = seriesWithLatest.map((_, idx) => (idx + 1) ** 2);
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const level = seriesWithLatest.reduce((sum, value, idx) => sum + value * weights[idx], 0) / weightSum;

  // 변환 후 추세 계산
  const transformed = seriesWithLatest.map((v) => transformValue(v, transform));
  const valid = transformed.every((v) => Number.isFinite(v));
  const trend = valid ? computeWeightedSlope(transformed, weights) : 0;

  return { level, trend, usedSeries: seriesWithLatest };
}


function trendToDisplay(trend, transform = 'none') {
  if (!Number.isFinite(trend)) return 0;
  if (transform === 'logPercent') return trend * 100;
  if (transform === 'logAbsolute') return trend;
  return trend;
}

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(10, num));
}

/**
 * Break down investment grade calculations with intermediate components
 *
 * @param {object} kpis - KPI values
 * @returns {object} Score breakdown for tooltips and display
 */
export function getScoreBreakdown(kpis = {}, kpiHistory = []) {
  const safeKpis = {
    debtRatio: toSafeNumber(kpis.debtRatio),
    currentRatio: toSafeNumber(kpis.currentRatio),
    riskScore: toSafeNumber(kpis.riskScore),
    governanceScore: toSafeNumber(kpis.governanceScore),
    revenueGrowth: toSafeNumber(kpis.revenueGrowth),
    operatingMargin: toSafeNumber(kpis.operatingMargin),
    roe: toSafeNumber(kpis.roe),
    eps: toSafeNumber(kpis.eps),
    dividendPerShare: toSafeNumber(kpis.dividendPerShare)
  };

  const crossSection = {
    debtRatio: collectCrossSection(kpiHistory, 'debtRatio'),
    currentRatio: collectCrossSection(kpiHistory, 'currentRatio'),
    riskScore: collectCrossSection(kpiHistory, 'riskScore'),
    governanceScore: collectCrossSection(kpiHistory, 'governanceScore'),
    revenueGrowth: collectCrossSection(kpiHistory, 'revenueGrowth'),
    operatingMargin: collectCrossSection(kpiHistory, 'operatingMargin'),
    roe: collectCrossSection(kpiHistory, 'roe'),
    eps: collectCrossSection(kpiHistory, 'eps')
  };

  const metrics = {
    risk: computeLevelAndTrend(kpiHistory, 'riskScore', safeKpis.riskScore),
    governance: computeLevelAndTrend(kpiHistory, 'governanceScore', safeKpis.governanceScore),
    revenue: computeLevelAndTrend(kpiHistory, 'revenueGrowth', safeKpis.revenueGrowth, { transform: 'logPercent' }),
    opm: computeLevelAndTrend(kpiHistory, 'operatingMargin', safeKpis.operatingMargin, { transform: 'logPercent' }),
    roe: computeLevelAndTrend(kpiHistory, 'roe', safeKpis.roe, { transform: 'logPercent' }),
    eps: computeLevelAndTrend(kpiHistory, 'eps', safeKpis.eps, { transform: 'logAbsolute' }),
    dividend: computeLevelAndTrend(kpiHistory, 'dividendPerShare', safeKpis.dividendPerShare, { transform: 'logAbsolute' })
  };

  // Safety: Leverage + Liquidity + Profit Stability + Governance/Risk (equal weight)
  const leverageScore = normalizeLinear(safeKpis.debtRatio, 0, 300, 0, 10, true);
  const liquidityScore = normalizeLinear(safeKpis.currentRatio, 0, 250);
  const opmCv = calculateVolatility(metrics.opm.usedSeries);
  const profitStabilityScore = normalizeLinear(opmCv, 0, 1.5, 0, 10, true);
  const riskLevelValue = Number.isFinite(safeKpis.riskScore) ? safeKpis.riskScore : metrics.risk.level;
  const governanceLevelValue = Number.isFinite(safeKpis.governanceScore) ? safeKpis.governanceScore : metrics.governance.level;

  const riskNormalized = normalizeLinear(riskLevelValue, 0, 100);
  const govNormalized = normalizeLinear(governanceLevelValue, 0, 10);

  const riskTrendScore = normalizeCrossSection(trendToDisplay(metrics.risk.trend), [], {
    fallbackMin: -5,
    fallbackMax: 5,
    minSamples: 0
  });
  const govTrendScore = normalizeCrossSection(trendToDisplay(metrics.governance.trend), [], {
    fallbackMin: -1,
    fallbackMax: 1,
    minSamples: 0
  });

  const governanceRiskBase = (riskNormalized + govNormalized) / 2;
  const governanceRiskAdjustment = ((riskTrendScore + govTrendScore) / 2 - 5) * 0.05; // ±0.25점 보정으로 추세 영향 추가 축소
  const governanceRiskScore = clampScore(governanceRiskBase + governanceRiskAdjustment);
  const safetyScore = clampScore((leverageScore + liquidityScore + profitStabilityScore + governanceRiskScore) / 4);

  // Growth: Level/Trend split (Level 90%, Trend 10%)
  const revenueTrendValue = trendToDisplay(metrics.revenue.trend, 'logPercent');
  const opmTrendValue = trendToDisplay(metrics.opm.trend, 'logPercent');
  const revenueLevelScore = normalizeCrossSection(metrics.revenue.level, crossSection.revenueGrowth, {
    fallbackMin: -20,
    fallbackMax: 40
  });
  const opmLevelScore = normalizeCrossSection(metrics.opm.level, crossSection.operatingMargin, {
    fallbackMin: -10,
    fallbackMax: 30
  });
  const revenueTrendScore = normalizeCrossSection(revenueTrendValue, [], {
    fallbackMin: -20,
    fallbackMax: 20,
    minSamples: 0
  });
  const opmTrendScore = normalizeCrossSection(opmTrendValue, [], {
    fallbackMin: -10,
    fallbackMax: 10,
    minSamples: 0
  });
  const growthLevel = revenueLevelScore * 0.6 + opmLevelScore * 0.4;
  const growthTrend = revenueTrendScore * 0.6 + opmTrendScore * 0.4;
  const growthScore = clampScore(growthLevel * 0.9 + growthTrend * 0.1);

  // Returns: ROE + EPS (level + CAGR) – volatility penalty
  const roeTrendValue = trendToDisplay(metrics.roe.trend, 'logPercent');
  const epsTrendValue = trendToDisplay(metrics.eps.trend, 'logAbsolute');
  const roeNormalized = normalizeCrossSection(metrics.roe.level, crossSection.roe, {
    fallbackMin: -10,
    fallbackMax: 20
  });
  const roeTrendScore = normalizeCrossSection(roeTrendValue, [], {
    fallbackMin: -10,
    fallbackMax: 15,
    minSamples: 0
  });
  const epsLevelScore = normalizeCrossSection(metrics.eps.level, crossSection.eps, {
    fallbackMin: -5000,
    fallbackMax: 5000
  });
  const epsTrendScore = normalizeCrossSection(epsTrendValue, [], {
    fallbackMin: -20,
    fallbackMax: 20,
    minSamples: 0
  });
  const epsCagr = calculateGrowthRate(metrics.eps.usedSeries, safeKpis.eps);
  const epsCagrScore = normalizeCrossSection(epsCagr, [], {
    fallbackMin: -50,
    fallbackMax: 80,
    minSamples: 0
  });
  const epsCv = calculateVolatility(metrics.eps.usedSeries);
  const epsPenalty = Math.min(Math.max((epsCv - 0.3) / 0.3, 0), 2.5);
  const returnsScore = clampScore(
    roeNormalized * 0.35 +
    roeTrendScore * 0.10 +
    epsCagrScore * 0.25 +
    epsLevelScore * 0.20 +
    epsTrendScore * 0.10 -
    epsPenalty
  );

  // Dividend (+@) remains informational
  const dividendGrowth = calculateGrowthRate(metrics.dividend.usedSeries, safeKpis.dividendPerShare);
  const dividendGrowthNormalized = normalizeCrossSection(dividendGrowth, [], {
    fallbackMin: -30,
    fallbackMax: 50,
    minSamples: 0
  });
  const dividendVolatility = calculateVolatility(metrics.dividend.usedSeries);
  const dividendStabilityBonus = metrics.dividend.usedSeries.length > 0
    ? normalizeLinear(Math.max(0, 1 - dividendVolatility), 0, 1, 0, 2)
    : 0;
  const dividendScore = Math.min(10, dividendGrowthNormalized + dividendStabilityBonus);
  const hasDividendData = hasPositiveDividend(metrics.dividend.usedSeries, safeKpis.dividendPerShare);

  // Overall Grade (Option B: safety first)
  const overall = safetyScore * 0.4 + growthScore * 0.3 + returnsScore * 0.3;

  return {
    safety: {
      score: safetyScore,
      parts: {
        riskComponent: riskNormalized,
        govComponent: govNormalized,
        leverageScore,
        liquidityScore,
        profitStabilityScore,
        governanceRiskBase,
        governanceRiskAdjustment,
        governanceRiskScore,
        trend: {
          riskScore: { value: trendToDisplay(metrics.risk.trend) },
          governanceScore: { value: trendToDisplay(metrics.governance.trend) }
        }
      }
    },
    growth: {
      score: growthScore,
      parts: {
        revenueNormalized: revenueLevelScore,
        operatingNormalized: opmLevelScore,
        growthLevel,
        growthTrend,
        trend: {
          revenueGrowth: { value: revenueTrendValue, usedSeries: metrics.revenue.usedSeries },
          operatingMargin: { value: opmTrendValue, usedSeries: metrics.opm.usedSeries }
        }
      }
    },
    returns: {
      score: returnsScore,
      parts: {
        roeNormalized,
        roeTrendScore,
        epsLevelScore,
        epsCagrScore,
        epsTrendScore,
        epsNormalized: epsCagrScore,
        epsPenalty,
        epsAdjusted: Math.max(0, epsCagrScore + epsLevelScore - epsPenalty),
        hasDividendData,
        dividendGrowthNormalized,
        dividendStabilityBonus,
        dividendScore,
        trend: {
          roe: { value: roeTrendValue, usedSeries: metrics.roe.usedSeries },
          eps: { value: epsTrendValue, usedSeries: metrics.eps.usedSeries },
          dividendPerShare: { value: trendToDisplay(metrics.dividend.trend, 'logAbsolute'), usedSeries: metrics.dividend.usedSeries }
        }
      }
    },
    overall
  };
}

/**
 * Calculate Investment Grade
 *
 * Provides comprehensive scoring across three dimensions:
 * 1. Safety Score (Risk + Governance)
 * 2. Growth Score (Revenue Growth + Operating Margin)
 * 3. Returns Score (ROE + EPS) with dividend noted separately as +@
 *
 * @param {object} kpis - KPI values
 * @param {number} kpis.riskScore - Risk score (0-100)
 * @param {number} kpis.governanceScore - Governance score (0-10)
 * @param {number} kpis.revenueGrowth - Revenue growth YoY (%)
 * @param {number} kpis.operatingMargin - Operating margin (%)
 * @param {number} kpis.roe - Return on equity (%)
 * @param {number} kpis.eps - Earnings per share (원)
 * @param {number} kpis.dividendPerShare - Dividend per share (원)
 * @returns {object} Investment grade breakdown
 */
export function calculateInvestmentGrade(kpis, kpiHistory = []) {
  const breakdown = getScoreBreakdown(kpis, kpiHistory);

  return {
    safety: Number(breakdown.safety.score.toFixed(1)),
    growth: Number(breakdown.growth.score.toFixed(1)),
    returns: Number(breakdown.returns.score.toFixed(1)),
    overall: Number(breakdown.overall.toFixed(1)),
    grade: getLetterGrade(breakdown.overall),
    recommendation: getRecommendation(breakdown.overall, breakdown.safety.score),
    stars: getStarRating(breakdown.overall),
    breakdown
  };
}

/**
 * Convert numeric score to letter grade
 * @param {number} score - Overall score (0-10)
 * @returns {string} Letter grade
 */
function getLetterGrade(score) {
  if (score >= 7.7) return 'A#';
  if (score >= 7.1) return 'A+';
  if (score >= 6.8) return 'A';
  if (score >= 6.5) return 'A-';
  if (score >= 6.2) return 'B+';  // 기준점
  if (score >= 5.9) return 'B';
  if (score >= 5.6) return 'B-';
  if (score >= 5.3) return 'C+';
  if (score >= 5.0) return 'C';
  if (score >= 4.7) return 'C-';
  return 'F';
}


/**
 * Generate investment recommendation
 * @param {number} overall - Overall score
 * @param {number} safety - Safety score
 * @returns {string} Recommendation text
 */
function getRecommendation(overall, safety) {
  // Safety-first approach: even high overall score needs adequate safety
  if (overall >= 8 && safety >= 7) return '투자 추천';
  if (overall >= 7 && safety >= 6) return '긍정적 검토 대상';
  if (overall >= 6 && safety >= 5) return '관심 종목';
  if (overall >= 5) return '관망 (추가 분석 필요)';
  if (overall >= 4) return '주의';
  return '비추천';
}

/**
 * Convert score to star rating (1-5)
 * @param {number} score - Overall score (0-10)
 * @returns {number} Star rating (1-5)
 */
function getStarRating(score) {
  if (score >= 9) return 5;
  if (score >= 7) return 4;
  if (score >= 5) return 3;
  if (score >= 3) return 2;
  return 1;
}

/**
 * Get category-specific insights
 * @param {number} score - Category score (0-10)
 * @param {string} category - Category name (safety/growth/returns)
 * @returns {string} Insight text
 */
export function getCategoryInsight(score, category) {
  const insights = {
    safety: {
      excellent: '낮은 리스크, 우수한 거버넌스 (투자 안전성 높음)',
      good: '안정적 재무 구조 (투자 안전성 양호)',
      warning: '일부 리스크 존재 (추가 분석 권장)',
      poor: '높은 리스크 (개선 확인 시까지 관망)'
    },
    growth: {
      excellent: '빠른 성장세 유지 중 (매출·수익성 모두 상승)',
      good: '양호한 성장률 기록 중',
      warning: '성장 둔화 (향후 전망 모니터링 필요)',
      poor: '성장 정체 (회복 신호 확인 대기)'
    },
    returns: {
      excellent: '우수한 수익성 (ROE·EPS 높은 수준)',
      good: '양호한 주주 수익 제공 중',
      warning: '평범한 수익성 (개선 여부 관찰)',
      poor: '낮은 수익성 (투자 매력도 제한적)'
    }
  };

  const categoryInsights = insights[category];
  if (!categoryInsights) return '';

  if (score >= 8) return categoryInsights.excellent;
  if (score >= 6) return categoryInsights.good;
  if (score >= 4) return categoryInsights.warning;
  return categoryInsights.poor;
}

/**
 * Calculate trend (YoY change)
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {object} Trend information
 */
export function calculateTrend(current, previous) {
  if (current === null || previous === null || current === undefined || previous === undefined) {
    return { change: null, changePercent: null, direction: 'neutral' };
  }

  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  let direction = 'neutral';
  if (changePercent > 0.5) direction = 'up';
  else if (changePercent < -0.5) direction = 'down';

  return {
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    direction
  };
}
