// 재무 건전성 및 수익성 기반 거버넌스 점수 계산

import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 재무 데이터 기반 거버넌스 점수 계산
 *
 * 10점 만점 기준:
 * - 자본총계 규모: 클수록 좋음 (3점)
 * - 영업현금흐름: 플러스일수록 좋음 (3점)
 * - 당기순이익: 흑자일수록 좋음 (2점)
 * - 자산 대비 부채: 낮을수록 좋음 (2점)
 *
 * @param {Object} normalized - 정규화된 재무데이터
 * @returns {number} 거버넌스 점수 (0-10)
 */
function calculateGovernanceScore(normalized) {
  if (!normalized) {
    return null; // 데이터 없음
  }

  let score = 0;

  // 1. 자본총계 규모 (3점 만점)
  // 자본이 클수록 안정적인 경영 기반
  if (normalized.total_equity !== null) {
    const equity = Number(normalized.total_equity);
    if (equity >= 500000000000) { // 5000억 이상
      score += 3;
    } else if (equity >= 100000000000) { // 1000억 이상
      score += 2.5;
    } else if (equity >= 50000000000) { // 500억 이상
      score += 2;
    } else if (equity >= 10000000000) { // 100억 이상
      score += 1.5;
    } else if (equity > 0) {
      score += 1;
    }
    // 자본잠식 (음수): 0점
  }

  // 2. 영업현금흐름 (3점 만점)
  // 현금 창출 능력 = 건전한 사업 운영
  if (normalized.operating_cash_flow !== null) {
    const ocf = Number(normalized.operating_cash_flow);
    const revenue = normalized.revenue ? Number(normalized.revenue) : 1;
    const ocfRatio = (ocf / revenue) * 100;

    if (ocfRatio >= 20) {
      score += 3; // 매우 우수
    } else if (ocfRatio >= 10) {
      score += 2.5; // 우수
    } else if (ocfRatio >= 5) {
      score += 2; // 양호
    } else if (ocfRatio >= 0) {
      score += 1; // 보통
    }
    // 마이너스: 0점
  }

  // 3. 당기순이익 (2점 만점)
  // 수익성 = 주주 가치 창출
  if (normalized.net_income !== null) {
    const netIncome = Number(normalized.net_income);
    if (netIncome >= 10000000000) { // 100억 이상
      score += 2;
    } else if (netIncome >= 5000000000) { // 50억 이상
      score += 1.5;
    } else if (netIncome >= 1000000000) { // 10억 이상
      score += 1;
    } else if (netIncome > 0) {
      score += 0.5;
    }
    // 적자: 0점
  }

  // 4. 부채 비율 (2점 만점)
  // 낮은 부채 = 건전한 재무구조
  if (normalized.total_liabilities !== null && normalized.total_assets !== null && normalized.total_assets !== 0n) {
    const debtToAssetRatio = (Number(normalized.total_liabilities) / Number(normalized.total_assets)) * 100;

    if (debtToAssetRatio < 30) {
      score += 2; // 매우 우수
    } else if (debtToAssetRatio < 50) {
      score += 1.5; // 우수
    } else if (debtToAssetRatio < 70) {
      score += 1; // 보통
    } else if (debtToAssetRatio < 80) {
      score += 0.5; // 주의
    }
    // 80% 이상: 0점
  }

  // 최소 0, 최대 10 제한
  return Math.max(0, Math.min(10, parseFloat(score.toFixed(1))));
}

/**
 * 거버넌스 점수 계산 및 저장
 *
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @param {Object} normalized - 정규화된 재무데이터
 * @returns {Object} 저장된 거버넌스 데이터
 */
export async function calculateAndSaveGovernanceScore(corpCode, bsnsYear, normalized) {
  try {
    // 1. 거버넌스 점수 계산
    const governanceScore = calculateGovernanceScore(normalized);

    if (governanceScore === null) {
      console.log(`[Governance Service] No financial data for ${corpCode} (${bsnsYear})`);
      return {
        corpCode,
        bsnsYear,
        governanceScore: null
      };
    }

    // 2. DB에 저장 (UPSERT)
    const now = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 17); // yyyyMMddHHmmssfff
    const tblkey = uuidv4().replace(/-/g, '');

    const [existing] = await pool.query(
      'SELECT TBLKEY FROM DL_GOVERNANCE_DATA WHERE corp_code = ? AND bsns_year = ?',
      [corpCode, bsnsYear]
    );

    if (existing.length > 0) {
      // UPDATE
      await pool.query(
        `UPDATE DL_GOVERNANCE_DATA
         SET MODIFYDATE = ?, governance_score = ?
         WHERE corp_code = ? AND bsns_year = ?`,
        [now, governanceScore, corpCode, bsnsYear]
      );
      console.log(`[Governance Service] Updated governance score for ${corpCode} (${bsnsYear}): score=${governanceScore}`);
    } else {
      // INSERT
      await pool.query(
        `INSERT INTO DL_GOVERNANCE_DATA (TBLKEY, ADDDATE, MODIFYDATE, corp_code, bsns_year, governance_score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tblkey, now, now, corpCode, bsnsYear, governanceScore]
      );
      console.log(`[Governance Service] Inserted governance score for ${corpCode} (${bsnsYear}): score=${governanceScore}`);
    }

    return {
      corpCode,
      bsnsYear,
      governanceScore
    };
  } catch (error) {
    console.error(`[Governance Service] Error calculating governance score for ${corpCode}:`, error.message);
    return {
      corpCode,
      bsnsYear,
      governanceScore: null,
      error: error.message
    };
  }
}

/**
 * DB에서 거버넌스 데이터 조회
 *
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @returns {Object|null} 거버넌스 데이터 또는 null
 */
export async function getGovernanceDataFromDB(corpCode, bsnsYear) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM DL_GOVERNANCE_DATA WHERE corp_code = ? AND bsns_year = ? ORDER BY MODIFYDATE DESC LIMIT 1',
      [corpCode, bsnsYear]
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      corpCode: rows[0].corp_code,
      bsnsYear: rows[0].bsns_year,
      governanceScore: rows[0].governance_score,
      majorShareholderCount: rows[0].major_shareholder_count,
      lastUpdated: rows[0].MODIFYDATE
    };
  } catch (error) {
    console.error(`[Governance Service] Error fetching governance data from DB for ${corpCode}:`, error.message);
    return null;
  }
}
