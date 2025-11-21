import { formatBillions, formatPercentage, formatWon, formatScore } from "../../utils/formatters";

export const FORMATTERS = {
  eok: formatBillions,
  pct: formatPercentage,
  won: formatWon,
  num: formatScore,
};

/**
 * Color Code: Operating Profit Margin (영업이익률)
 *
 * Thresholds:
 * - Excellent (green): >= 10%
 * - Warning (yellow): 5% ~ 10%
 * - Poor (red): < 5%
 *
 * @param {number|null} value - Operating profit margin percentage
 * @returns {string} CSS class name for color coding
 */
export function colorOperatingMargin(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 10) return "metric-excellent";
  if (value >= 5) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: Net Income Margin (순이익률)
 *
 * Thresholds:
 * - Excellent (green): >= 8%
 * - Warning (yellow): 3% ~ 8%
 * - Poor (red): < 3%
 *
 * @param {number|null} value - Net income margin percentage
 * @returns {string} CSS class name for color coding
 */
export function colorNetMargin(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 8) return "metric-excellent";
  if (value >= 3) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: Debt Ratio (부채비율)
 *
 * Thresholds (lower is better):
 * - Excellent (blue): <= 100%
 * - Good (green): 100% ~ 200%
 * - Warning (yellow): 200% ~ 300%
 * - Poor (red): >= 300%
 *
 * @param {number|null} value - Debt ratio percentage
 * @returns {string} CSS class name for color coding
 */
export function colorDebtRatio(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value <= 100) return "metric-excellent";
  if (value <= 200) return "metric-good";
  if (value <= 300) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: ROE (자기자본이익률)
 *
 * Thresholds:
 * - Excellent (green): >= 10%
 * - Good (light green): 5% ~ 10%
 * - Warning (yellow): 0% ~ 5%
 * - Poor (red): < 0%
 *
 * @param {number|null} value - ROE percentage
 * @returns {string} CSS class name for color coding
 */
export function colorROE(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 10) return "metric-excellent";
  if (value >= 5) return "metric-good";
  if (value >= 0) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: Current Ratio (유동비율)
 *
 * Thresholds:
 * - Excellent (green): >= 200%
 * - Good (light green): 150% ~ 200%
 * - Warning (yellow): 100% ~ 150%
 * - Poor (red): < 100%
 *
 * @param {number|null} value - Current ratio percentage
 * @returns {string} CSS class name for color coding
 */
export function colorCurrentRatio(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 200) return "metric-excellent";
  if (value >= 150) return "metric-good";
  if (value >= 100) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: Revenue Growth (매출성장률)
 *
 * Thresholds:
 * - Excellent (green): >= 20%
 * - Good (light green): 10% ~ 20%
 * - Warning (yellow): 0% ~ 10%
 * - Poor (red): < 0%
 *
 * @param {number|null} value - Revenue growth percentage (YoY)
 * @returns {string} CSS class name for color coding
 */
export function colorRevenueGrowth(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 20) return "metric-excellent";
  if (value >= 10) return "metric-good";
  if (value >= 0) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: Risk Score (리스크 점수)
 *
 * Formula: 100 - (부도×40 + 회생×40 + 감사×20 + 정지×20 + 소송×2)
 * Higher is better (safer)
 *
 * Thresholds:
 * - Excellent (green): 80 ~ 100
 * - Good (light green): 60 ~ 79
 * - Warning (yellow): 40 ~ 59
 * - Poor (red): 0 ~ 39
 *
 * @param {number|null} value - Risk score (0-100)
 * @returns {string} CSS class name for color coding
 */
export function colorRiskScore(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 80) return "metric-excellent";
  if (value >= 60) return "metric-good";
  if (value >= 40) return "metric-warning";
  return "metric-poor";
}

/**
 * Color Code: Governance Score (거버넌스 점수)
 *
 * Formula: 대주주 안정성(4) + 내부자거래(3) + 직원증가(3)
 * Higher is better
 *
 * Thresholds:
 * - Excellent (green): 8 ~ 10
 * - Good (light green): 6 ~ 8
 * - Warning (yellow): 4 ~ 6
 * - Poor (red): 0 ~ 4
 *
 * @param {number|null} value - Governance score (0-10)
 * @returns {string} CSS class name for color coding
 */
export function colorGovernanceScore(value) {
  if (value === null || value === undefined) {
    return "metric-neutral";
  }

  if (value >= 8) return "metric-excellent";
  if (value >= 6) return "metric-good";
  if (value >= 4) return "metric-warning";
  return "metric-poor";
}

/**
 * Resolve color class based on metric type and value
 *
 * Updated for MVP V2.0 with 9 KPIs
 *
 * @param {*} value - Metric value
 * @param {object} colorConfig - Color configuration from INSIGHT_METRICS
 * @returns {string} CSS class name
 */
export function resolveColor(value, colorConfig) {
  if (!colorConfig) {
    return "metric-neutral";
  }

  switch (colorConfig.type) {
    case "static":
      return colorConfig.value || "metric-neutral";
    case "roe":
      return colorROE(value);
    case "debt":
      return colorDebtRatio(value);
    case "current":
      return colorCurrentRatio(value);
    case "opm":
      return colorOperatingMargin(value);
    case "growth":
      return colorRevenueGrowth(value);
    case "risk":
      return colorRiskScore(value);
    case "governance":
      return colorGovernanceScore(value);
    // Legacy support (to be removed)
    case "nim":
      return colorNetMargin(value);
    case "retained":
      return colorRetainedRatio(value, colorConfig.thresholds);
    default:
      return "metric-neutral";
  }
}

/**
 * Get latest valid (non-null) value from time series
 *
 * Searches backward from most recent year to find first non-null value
 *
 * @param {Array<object>} data - Array of year data objects
 * @param {string} key - Property name to extract
 * @returns {*} Latest valid value or null
 */
export function getLatestValid(data, key) {
  for (let i = data.length - 1; i >= 0; i--) {
    const value = data[i]?.[key];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
}
