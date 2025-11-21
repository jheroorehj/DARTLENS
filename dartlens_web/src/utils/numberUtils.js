/**
 * Safely convert any value to a number
 * @param {*} value - Value to convert
 * @param {*} defaultValue - Fallback when conversion fails
 * @returns {number|null} - Converted number or defaultValue if invalid
 */
export function safeToNumber(value, defaultValue = null) {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return Number.isFinite(value) ? value : defaultValue;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').replace(/%/g, '').trim();
    if (cleaned === '') return defaultValue;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
}

/**
 * Return a safe number or the provided fallback
 */
export function safeNumberOr(value, fallback = 0) {
  const num = safeToNumber(value, null);
  return num !== null ? num : fallback;
}

/**
 * Safely format number to fixed decimal places
 * @param {*} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted string or 'N/A'
 */
export function safeToFixed(value, decimals = 2) {
  const num = safeToNumber(value);
  return num !== null ? num.toFixed(decimals) : 'N/A';
}

/**
 * Safely format number with locale string
 * @param {*} value - Value to format
 * @returns {string} - Formatted string or 'N/A'
 */
export function safeToLocaleString(value) {
  const num = safeToNumber(value);
  return num !== null ? Math.round(num).toLocaleString() : 'N/A';
}

/**
 * Check if value is a valid number
 * @param {*} value - Value to check
 * @returns {boolean} - True if valid number
 */
export function isValidNumber(value) {
  return safeToNumber(value) !== null;
}
