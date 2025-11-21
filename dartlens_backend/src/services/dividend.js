// DART API에서 배당 데이터 조회 및 저장

import pool from '../db.js';
import { getDividendInfo } from './dartService.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 주당배당금(DPS) 추출
 *
 * @param {Object} dividendData - DART API 배당 데이터
 * @returns {bigint|null} 주당배당금 (원)
 */
function extractDPS(dividendData) {
  if (!dividendData || !dividendData.list || dividendData.list.length === 0) {
    return null;
  }

  // DART API 배당 데이터에서 "주당 현금배당금(원)" 필드 추출
  // se 필드가 "주당 현금배당금(원)"이고 stock_knd가 "보통주"인 항목 찾기
  const dividendInfo = dividendData.list.find(item =>
    item.se === '주당 현금배당금(원)' &&
    (item.stock_knd === '보통주' || !item.stock_knd)
  );

  if (!dividendInfo) {
    return null;
  }

  // thstrm (당기) 값 파싱
  const dpsValue = dividendInfo.thstrm;
  if (!dpsValue || dpsValue === '-') {
    return null; // 배당 없음
  }

  // 콤마 제거 후 숫자로 변환
  try {
    const cleanValue = dpsValue.replace(/,/g, '');
    return BigInt(parseInt(cleanValue, 10));
  } catch (error) {
    console.error('[Dividend Service] DPS parsing error:', error.message);
    return null;
  }
}

/**
 * 배당수익률 계산
 *
 * 배당수익률 = (주당배당금 / 주가) × 100
 *
 * @param {bigint} dps - 주당배당금
 * @param {number} stockPrice - 주가 (원)
 * @returns {number|null} 배당수익률 (%)
 */
function calculateDividendYield(dps, stockPrice) {
  if (!dps || !stockPrice || stockPrice === 0) {
    return null;
  }

  try {
    const yield_ = (Number(dps) / stockPrice) * 100;
    return parseFloat(yield_.toFixed(2));
  } catch (error) {
    console.error('[Dividend Service] Dividend yield calculation error:', error.message);
    return null;
  }
}

/**
 * 배당성향 계산
 *
 * 배당성향 = (총배당금 / 당기순이익) × 100
 *
 * @param {bigint} totalDividend - 총배당금
 * @param {bigint} netIncome - 당기순이익
 * @returns {number|null} 배당성향 (%)
 */
function calculatePayoutRatio(totalDividend, netIncome) {
  if (!totalDividend || !netIncome || netIncome === 0n) {
    return null;
  }

  try {
    const ratio = (Number(totalDividend) / Number(netIncome)) * 100;
    return parseFloat(ratio.toFixed(2));
  } catch (error) {
    console.error('[Dividend Service] Payout ratio calculation error:', error.message);
    return null;
  }
}

/**
 * 배당 데이터 조회 및 저장
 *
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @param {Object} options - 추가 옵션 (stockPrice, netIncome)
 * @returns {Object} 저장된 배당 데이터
 */
export async function fetchAndSaveDividendData(corpCode, bsnsYear, reprtCode = '11014', options = {}) {
  try {
    // 1. DART API에서 배당 데이터 조회
    const dividendData = await getDividendInfo({
      corp_code: corpCode,
      bsns_year: bsnsYear,
      reprt_code: reprtCode
    });

    // 2. 주당배당금(DPS) 추출
    const dps = extractDPS(dividendData);

    // 3. 배당수익률 계산 (상장사만 가능, stockPrice 필요)
    const dividendYield = options.stockPrice
      ? calculateDividendYield(dps, options.stockPrice)
      : null;

    // 4. 배당성향 계산 (netIncome 필요)
    const payoutRatio = options.netIncome && dps
      ? calculatePayoutRatio(dps * options.issuedShares, options.netIncome)
      : null;

    // 5. DB에 저장 (UPSERT)
    const now = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 17); // yyyyMMddHHmmssfff
    const tblkey = uuidv4().replace(/-/g, '');

    const [existing] = await pool.query(
      'SELECT TBLKEY FROM DL_DIVIDENDS WHERE corp_code = ? AND bsns_year = ?',
      [corpCode, bsnsYear]
    );

    if (existing.length > 0) {
      // UPDATE
      await pool.query(
        `UPDATE DL_DIVIDENDS
         SET MODIFYDATE = ?, dps = ?, dividend_yield = ?, payout_ratio = ?
         WHERE corp_code = ? AND bsns_year = ?`,
        [now, dps, dividendYield, payoutRatio, corpCode, bsnsYear]
      );
      console.log(`[Dividend Service] Updated dividend data for ${corpCode} (${bsnsYear}): DPS=${dps}`);
    } else {
      // INSERT
      await pool.query(
        `INSERT INTO DL_DIVIDENDS (TBLKEY, ADDDATE, MODIFYDATE, corp_code, bsns_year, dps, dividend_yield, payout_ratio)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tblkey, now, now, corpCode, bsnsYear, dps, dividendYield, payoutRatio]
      );
      console.log(`[Dividend Service] Inserted dividend data for ${corpCode} (${bsnsYear}): DPS=${dps}`);
    }

    return {
      corpCode,
      bsnsYear,
      dps,
      dividendYield,
      payoutRatio
    };
  } catch (error) {
    console.error(`[Dividend Service] Error fetching dividend data for ${corpCode}:`, error.message);
    throw error;
  }
}

/**
 * 5개년 배당 데이터 조회 및 저장
 *
 * @param {string} corpCode - 기업 코드
 * @param {number} years - 조회할 연도 수 (기본 5년)
 * @param {Array} financialDataArray - 재무데이터 배열 (netIncome, issuedShares 포함)
 * @returns {Array} 5개년 배당 데이터 배열
 */
export async function fetchMultiYearDividendData(corpCode, years = 5, financialDataArray = []) {
  const currentYear = new Date().getFullYear();
  const dividendDataArray = [];

  for (let i = 0; i < years; i++) {
    const year = (currentYear - i).toString();

    // 해당 연도의 재무데이터 찾기
    const financialData = financialDataArray.find(item => item.year === year);
    const options = financialData
      ? {
          netIncome: financialData.normalized?.net_income,
          issuedShares: financialData.normalized?.issued_shares,
          stockPrice: financialData.stockPrice // TODO: 주가 데이터 필요
        }
      : {};

    try {
      const dividendData = await fetchAndSaveDividendData(corpCode, year, '11014', options);
      dividendDataArray.push(dividendData);
    } catch (error) {
      console.error(`[Dividend Service] Failed to fetch dividend data for ${corpCode} (${year}):`, error.message);
      dividendDataArray.push({
        corpCode,
        bsnsYear: year,
        dps: null,
        dividendYield: null,
        payoutRatio: null,
        error: error.message
      });
    }
  }

  console.log(`[Dividend Service] Fetched ${dividendDataArray.length} years of dividend data for ${corpCode}`);
  return dividendDataArray;
}

/**
 * DB에서 배당 데이터 조회
 *
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @returns {Object|null} 배당 데이터 또는 null
 */
export async function getDividendDataFromDB(corpCode, bsnsYear) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM DL_DIVIDENDS WHERE corp_code = ? AND bsns_year = ? LIMIT 1',
      [corpCode, bsnsYear]
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      corpCode: rows[0].corp_code,
      bsnsYear: rows[0].bsns_year,
      dps: rows[0].dps ? Number(rows[0].dps) : null,
      dividendYield: rows[0].dividend_yield,
      payoutRatio: rows[0].payout_ratio,
      lastUpdated: rows[0].MODIFYDATE
    };
  } catch (error) {
    console.error(`[Dividend Service] Error fetching dividend data from DB for ${corpCode}:`, error.message);
    return null;
  }
}
