/**
 * Calculate Pearson Correlation Coefficient
 *
 * Measures linear correlation between two variables.
 * Returns value between -1 (perfect negative) and +1 (perfect positive).
 *
 * @param {Array<number>} x - First dataset
 * @param {Array<number>} y - Second dataset
 * @returns {number} Correlation coefficient
 */
export function calculateCorrelation(x, y) {
  // Filter out null/undefined values
  const pairs = x
    .map((xi, i) => [xi, y[i]])
    .filter(([xi, yi]) => xi !== null && yi !== null && xi !== undefined && yi !== undefined);

  if (pairs.length < 2) return 0;

  const xValues = pairs.map(p => p[0]);
  const yValues = pairs.map(p => p[1]);

  const n = pairs.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, xi, i) => sum + xi * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = yValues.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate Linear Regression
 *
 * Computes best-fit line and R² coefficient of determination.
 *
 * @param {Array<object>} data - Array of data points
 * @param {string} xKey - Property name for X values
 * @param {string} yKey - Property name for Y values
 * @returns {object} Regression results
 */
export function linearRegression(data, xKey, yKey) {
  // Filter valid data points
  const points = data
    .filter(d => d[xKey] !== null && d[yKey] !== null)
    .map(d => ({ x: d[xKey], y: d[yKey] }));

  if (points.length < 2) {
    return {
      slope: 0,
      intercept: 0,
      r2: 0,
      line: []
    };
  }

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = meanY - slope * meanX;

  // Calculate R² (coefficient of determination)
  const yPredicted = points.map(p => slope * p.x + intercept);
  const ssRes = points.reduce((sum, p, i) => sum + Math.pow(p.y - yPredicted[i], 2), 0);
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

  // Generate line points for visualization
  const xMin = Math.min(...points.map(p => p.x));
  const xMax = Math.max(...points.map(p => p.x));
  const line = [
    { x: xMin, y: slope * xMin + intercept },
    { x: xMax, y: slope * xMax + intercept }
  ];

  return {
    slope,
    intercept,
    r2: Math.max(0, Math.min(1, r2)), // Clamp to [0, 1]
    line,
    equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`
  };
}

/**
 * Get correlation strength description
 *
 * @param {number} correlation - Correlation coefficient (-1 to 1)
 * @returns {object} Strength description
 */
export function getCorrelationStrength(correlation) {
  const abs = Math.abs(correlation);
  const sign = correlation >= 0 ? '양의' : '음의';

  let strength = '';
  if (abs >= 0.9) strength = '매우 강한';
  else if (abs >= 0.7) strength = '강한';
  else if (abs >= 0.5) strength = '중간';
  else if (abs >= 0.3) strength = '약한';
  else strength = '매우 약한';

  return {
    strength,
    sign,
    description: `${strength} ${sign} 상관관계`,
    value: correlation.toFixed(3)
  };
}

/**
 * Calculate moving average
 *
 * @param {Array<number>} data - Time series data
 * @param {number} period - Moving average period
 * @returns {Array<number>} Smoothed data
 */
export function movingAverage(data, period = 3) {
  if (data.length < period) return data;

  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1)
        .filter(v => v !== null)
        .reduce((a, b) => a + b, 0);
      const count = data.slice(i - period + 1, i + 1).filter(v => v !== null).length;
      result.push(count > 0 ? sum / count : null);
    }
  }
  return result;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 *
 * @param {number} startValue - Initial value
 * @param {number} endValue - Final value
 * @param {number} years - Number of years
 * @returns {number} CAGR percentage
 */
export function calculateCAGR(startValue, endValue, years) {
  if (!startValue || !endValue || !years || startValue <= 0 || years <= 0) {
    return null;
  }

  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Detect outliers using IQR method
 *
 * @param {Array<number>} data - Dataset
 * @returns {object} Outlier analysis
 */
export function detectOutliers(data) {
  const sorted = [...data].filter(v => v !== null).sort((a, b) => a - b);
  const n = sorted.length;

  if (n < 4) return { outliers: [], indices: [] };

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = [];
  const indices = [];

  data.forEach((value, index) => {
    if (value !== null && (value < lowerBound || value > upperBound)) {
      outliers.push(value);
      indices.push(index);
    }
  });

  return {
    outliers,
    indices,
    lowerBound,
    upperBound,
    q1,
    q3,
    iqr
  };
}
