import pool from '../db.js';

/**
 * 계정과목 매핑 정보 캐시 (메모리 캐싱)
 * 서버 시작 시 한 번만 로드하여 성능 최적화
 */
let accountMappingsCache = null;

/**
 * DL_ACCOUNT_MAPPINGS 테이블에서 18개 계정 매핑 로드
 */
async function loadAccountMappings() {
  if (accountMappingsCache) {
    return accountMappingsCache;
  }

  const [rows] = await pool.query(`
    SELECT
      normalized_key,
      normalized_name_kr,
      xbrl_account_id,
      primary_kr_name,
      alias_1,
      alias_2,
      alias_3,
      category
    FROM DL_ACCOUNT_MAPPINGS
  `);

  // Map으로 변환하여 빠른 조회
  accountMappingsCache = new Map();
  for (const row of rows) {
    accountMappingsCache.set(row.normalized_key, row);
  }

  console.log(`[Normalization] Loaded ${accountMappingsCache.size} account mappings`);
  return accountMappingsCache;
}

/**
 * 공백 제거 정규화
 * @param {string} str - 정규화할 문자열
 * @returns {string} 공백이 제거된 문자열
 */
function normalizeWhitespace(str) {
  if (!str) return '';
  return str.replace(/\s+/g, '');
}

/**
 * 접두사 제거 (연결, 별도, 분기)
 * @param {string} str - 정규화할 문자열
 * @returns {string} 접두사가 제거된 문자열
 */
function removePrefix(str) {
  if (!str) return '';
  return str.replace(/^(연결|별도|분기|계속영업)/, '');
}

/**
 * 3-Tier 계정 정규화
 *
 * Tier 1: XBRL account_id 매칭 (국제 표준)
 * Tier 2: 한글명 정확 매칭 (공백 제거 후)
 * Tier 3: Alias 유사 매칭 (접두사 제거 후)
 *
 * @param {Array} dartApiList - DART API의 list 배열
 * @param {string} normalizedKey - 정규화 키 (예: 'REVENUE', 'NET_INCOME')
 * @returns {bigint|null} 매칭된 금액 (thstrm_amount) 또는 null
 */
async function normalizeAccount(dartApiList, normalizedKey) {
  if (!dartApiList || !Array.isArray(dartApiList)) {
    return null;
  }

  // 계정 매핑 정보 로드
  const mappings = await loadAccountMappings();
  const mapping = mappings.get(normalizedKey);

  if (!mapping) {
    console.warn(`[Normalization] No mapping found for key: ${normalizedKey}`);
    return null;
  }

  // ⚠️ CRITICAL: account_detail === "-" 필터 (Summary-level 데이터만)
  const summaryLevelList = dartApiList.filter(item => item.account_detail === '-');

  if (summaryLevelList.length === 0) {
    console.warn(`[Normalization] No summary-level data for ${normalizedKey}`);
    return null;
  }

  // Tier 1: XBRL account_id 매칭
  if (mapping.xbrl_account_id) {
    const matched = summaryLevelList.find(
      item => item.account_id === mapping.xbrl_account_id
    );
    if (matched) {
      console.log(`[Normalization] Tier 1 match for ${normalizedKey}: ${matched.account_nm}`);
      return parseAmount(matched.thstrm_amount);
    }
  }

  // Tier 2: 한글명 정확 매칭 (공백 제거)
  const normalizedPrimaryName = normalizeWhitespace(mapping.primary_kr_name);
  const tier2Match = summaryLevelList.find(item =>
    normalizeWhitespace(item.account_nm) === normalizedPrimaryName
  );
  if (tier2Match) {
    console.log(`[Normalization] Tier 2 match for ${normalizedKey}: ${tier2Match.account_nm}`);
    return parseAmount(tier2Match.thstrm_amount);
  }

  // Tier 3: Alias 유사 매칭 (접두사 제거)
  const aliases = [mapping.alias_1, mapping.alias_2, mapping.alias_3].filter(Boolean);

  for (const alias of aliases) {
    const normalizedAlias = removePrefix(normalizeWhitespace(alias));

    const tier3Match = summaryLevelList.find(item => {
      const normalizedAccountName = removePrefix(normalizeWhitespace(item.account_nm));
      return normalizedAccountName === normalizedAlias ||
             normalizeWhitespace(item.account_nm) === normalizeWhitespace(alias);
    });

    if (tier3Match) {
      console.log(`[Normalization] Tier 3 match for ${normalizedKey}: ${tier3Match.account_nm} (via alias: ${alias})`);
      return parseAmount(tier3Match.thstrm_amount);
    }
  }

  // 매칭 실패
  console.warn(`[Normalization] No match found for ${normalizedKey}`);
  return null;
}

/**
 * 금액 파싱 (문자열 → bigint)
 * @param {string|number} value - 파싱할 값
 * @returns {bigint|null}
 */
function parseAmount(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  try {
    // 숫자로 변환 (문자열일 경우 parseInt 사용)
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(numValue) ? null : BigInt(numValue);
  } catch (error) {
    console.error(`[Normalization] Amount parsing error: ${error.message}`);
    return null;
  }
}

/**
 * 기본주당이익(EPS) 계정 파싱 (재무제표에 직접 기재된 값을 사용)
 *
 * @param {Array} dartApiList - DART API의 list 배열
 * @returns {number|null} EPS 값 (원 단위, 소수점 허용)
 */
function parseBasicEps(dartApiList) {
  if (!Array.isArray(dartApiList) || dartApiList.length === 0) {
    return null;
  }

  const summaryLevelList = dartApiList.filter(item => item.account_detail === '-' || item.account_detail === undefined);
  if (summaryLevelList.length === 0) {
    return null;
  }

  const TARGET_ACCOUNT_IDS = [
    'ifrs-full_BasicEarningsLossPerShare',
    'ifrs-full_BasicEarningsLossPerShareIncludingDiscontinuedOperations',
    'ifrs-full_BasicEarningsPerShare',
    'dart_BasicEarningsLossPerShare'
  ];

  const TARGET_NAMES = ['기본주당이익', '보통주기본주당이익', '기본주당순이익'];

  const byId = summaryLevelList.find(item => TARGET_ACCOUNT_IDS.includes(item.account_id));
  if (byId && byId.thstrm_amount != null) {
    const parsed = Number(String(byId.thstrm_amount).replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  for (const nm of TARGET_NAMES) {
    const hit = summaryLevelList.find(item => normalizeWhitespace(item.account_nm) === normalizeWhitespace(nm));
    if (hit && hit.thstrm_amount != null) {
      const parsed = Number(String(hit.thstrm_amount).replace(/,/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

/**
 * 18개 핵심 계정 전체 정규화
 *
 * @param {Array} dartApiList - DART API의 list 배열
 * @returns {Object} 18개 계정의 정규화된 금액
 */
export async function normalizeAllAccounts(dartApiList) {
  const NORMALIZED_KEYS = [
    'REVENUE',
    'OPERATING_PROFIT',
    'NET_INCOME',
    'TOTAL_ASSETS',
    'TOTAL_LIABILITIES',
    'TOTAL_EQUITY',
    'CURRENT_ASSETS',
    'CURRENT_LIABILITIES',
    'NON_CURRENT_ASSETS',
    'NON_CURRENT_LIABILITIES',
    'INVENTORY',
    'ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE',
    'CASH',
    'OPERATING_CASH_FLOW',
    'INVESTING_CASH_FLOW',
    'FINANCING_CASH_FLOW',
    'DEPRECIATION'
  ];

  const normalized = {};

  for (const key of NORMALIZED_KEYS) {
    const amount = await normalizeAccount(dartApiList, key);
    // 키를 소문자 snake_case로 변환 (DB 컬럼명과 일치)
    const dbColumnName = key.toLowerCase();
    normalized[dbColumnName] = amount;
  }

  return normalized;
}

/**
 * DART API 응답에서 재무제표 데이터 추출 및 정규화
 *
 * @param {Object} dartApiResponse - DART API 응답 객체
 * @returns {Object|null} 정규화된 계정과목 객체 또는 null
 */
export async function extractAndNormalizeFinancials(dartApiResponse) {
  if (!dartApiResponse || !dartApiResponse.list) {
    console.warn('[Normalization] Invalid DART API response');
    return null;
  }

  const list = dartApiResponse.list;

  if (!Array.isArray(list) || list.length === 0) {
    console.warn('[Normalization] Empty DART API list');
    return null;
  }

  console.log(`[Normalization] Processing ${list.length} account items`);

  // 18개 계정 정규화
  const normalized = await normalizeAllAccounts(list);

  // DART에 기재된 기본주당이익 값 (발행주식수 API 실패 시 EPS 보정용)
  normalized.basic_eps = parseBasicEps(list);

  // 누락된 필드 추적
  const missingFields = Object.entries(normalized)
    .filter(([key, value]) => key !== 'basic_eps' && value === null)
    .map(([key, _]) => key);

  const totalAccounts = 18;
  console.log(`[Normalization] Normalized ${totalAccounts - missingFields.length}/${totalAccounts} accounts`);
  if (missingFields.length > 0) {
    console.log(`[Normalization] Missing fields: ${missingFields.join(', ')}`);
  }

  return {
    ...normalized,
    _metadata: {
      missingFields,
      totalAccounts,
      matchedAccounts: totalAccounts - missingFields.length,
      matchRate: (((totalAccounts - missingFields.length) / totalAccounts) * 100).toFixed(2) + '%'
    }
  };
}

/**
 * 발행주식수 추출 (상장사만)
 * @param {string} corp_code - 기업코드
 * @param {string} bsns_year - 사업연도
 * @param {string} reprt_code - 보고서 코드
 * @returns {bigint|null}
 */
export async function extractIssuedShares(corp_code, bsns_year, reprt_code) {
  try {
    const { getStockTotalStatus } = await import('./dartService.js');

    const reprtCandidates = [];
    if (reprt_code) reprtCandidates.push(reprt_code);
    for (const code of ['11014', '11013', '11012', '11011']) {
      if (!reprtCandidates.includes(code)) {
        reprtCandidates.push(code);
      }
    }

    for (const code of reprtCandidates) {
      try {
        const stockData = await getStockTotalStatus({
          corp_code,
          bsns_year,
          reprt_code: code
        });

        const shares = parseIssuedSharesFromList(stockData?.list);
        if (shares !== null) {
          if (reprt_code && reprt_code !== code) {
            console.log(`[Normalization] Fallback reprt_code=${code} used for issued shares`);
          }
          return shares;
        }
      } catch (error) {
        console.warn(`[Normalization] stockTotqySttus failed for reprt_code=${code}: ${error.message}`);
      }
    }

    return null;
  } catch (error) {
    console.error(`[Normalization] Failed to extract issued shares: ${error.message}`);
    return null;
  }
}

function parseIssuedSharesFromList(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }

  const parseShares = entry => {
    if (!entry || !entry.istc_totqy) return null;
    const shares = entry.istc_totqy.replace(/,/g, '');
    return shares && !Number.isNaN(Number(shares)) ? BigInt(shares) : null;
  };

  const commonStock = list.find(item => item.se?.trim() === '보통주');
  if (commonStock) {
    const shares = parseShares(commonStock);
    if (shares !== null) return shares;
  }

  for (const entry of list) {
    const shares = parseShares(entry);
    if (shares !== null) return shares;
  }

  return null;
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearCache() {
  accountMappingsCache = null;
  console.log('[Normalization] Cache cleared');
}

// 서버 시작 시 캐시 미리 로드 (DB 환경이 설정된 경우에만)
const hasDbConfig = process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DB;

if (hasDbConfig) {
  loadAccountMappings().catch(err => {
    console.error('[Normalization] Failed to load account mappings:', err);
  });
} else {
  console.warn('[Normalization] Skip preloading account mappings (DB env not set)');
}
