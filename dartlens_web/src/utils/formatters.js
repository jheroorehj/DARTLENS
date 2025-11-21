/**
 * Format number in billions (억 원)
 *
 * @param {number} value - The value to format
 * @returns {string} Formatted string with "억" suffix
 *
 * @example
 * formatBillions(123456789) // "1,234억"
 * formatBillions(null) // "N/A"
 */
export function formatBillions(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  const inBillions = Math.round(value / 100000000);
  return inBillions.toLocaleString() + "억";
}

/**
 * Format percentage value
 *
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 *
 * @example
 * formatPercentage(12.3456) // "12.3%"
 * formatPercentage(12.3456, 2) // "12.35%"
 * formatPercentage(null) // "N/A"
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(decimals) + "%";
}

/**
 * Format number with thousands separator
 *
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(null) // "N/A"
 */
export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }

  return value.toLocaleString();
}

/**
 * Format value in Korean Won (원)
 *
 * @param {number} value - The value to format
 * @returns {string} Formatted string with "원" suffix
 *
 * @example
 * formatWon(3540) // "3,540원"
 * formatWon(1444) // "1,444원"
 * formatWon(null) // "N/A"
 */
export function formatWon(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }
  return value.toLocaleString() + "원";
}

/**
 * Format score value (for Risk Score, Governance Score)
 *
 * @param {number} value - The score value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted score string
 *
 * @example
 * formatScore(100) // "100점"
 * formatScore(9.2, 1) // "9.2점"
 * formatScore(95) // "95점"
 * formatScore(null) // "N/A"
 */
export function formatScore(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }
  // For whole numbers, don't show decimals
  if (value === Math.floor(value)) {
    return value.toLocaleString() + "점";
  }
  return value.toFixed(decimals) + "점";
}

/**
 * Safely format a value using a formatter function
 * Returns "N/A" if value is null/undefined (matches Phase 4 spec)
 *
 * @param {Function} formatterFn - The formatting function to use
 * @param {*} value - The value to format
 * @returns {string} Formatted value or "N/A"
 */
export function safeFormat(formatterFn, value) {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return formatterFn(value);
}
