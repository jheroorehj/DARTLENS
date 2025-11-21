
// 재무 데이터를 기반으로 리스크 점수 계산

import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 재무 데이터 기반 리스크 점수 계산
 *
 * 100점 만점 기준 (높을수록 안전):
 * - 부채비율: 낮을수록 좋음 (40점)
 * - 유동비율: 높을수록 좋음 (30점)
 * - 영업이익률: 높을수록 좋음 (20점)
 * - ROE: 높을수록 좋음 (10점)
 *
 * @param {Object} normalized - 정규화된 재무데이터
 * @returns {number} 리스크 점수 (0-100, 높을수록 안전)
 */
function calculateRiskScore(normalized) {
  if (!normalized) {
    return null; // 데이터 없음
  }

  let score = 0;

  // 1. 부채비율 점수 (40점 만점)
  // 부채비율 = (부채총계 / 자본총계) × 100
  if (normalized.total_liabilities !== null && normalized.total_equity !== null && normalized.total_equity !== 0n) {
    const debtRatio = (Number(normalized.total_liabilities) / Number(normalized.total_equity)) * 100;

    if (debtRatio < 50) {
      score += 40; // 매우 안전
    } else if (debtRatio < 100) {
      score += 30; // 안전
    } else if (debtRatio < 150) {
      score += 20; // 보통
    } else if (debtRatio < 200) {
      score += 10; // 주의
    } else if (debtRatio < 300) {
      score += 5; // 위험
    }
    // 300% 이상: 0점 (매우 위험)
  }

  // 2. 유동비율 점수 (30점 만점)
  // 유동비율 = (유동자산 / 유동부채) × 100
  if (normalized.current_assets !== null && normalized.current_liabilities !== null && normalized.current_liabilities !== 0n) {
    const currentRatio = (Number(normalized.current_assets) / Number(normalized.current_liabilities)) * 100;

    if (currentRatio >= 200) {
      score += 30; // 매우 안전
    } else if (currentRatio >= 150) {
      score += 25; // 안전
    } else if (currentRatio >= 100) {
      score += 20; // 보통
    } else if (currentRatio >= 80) {
      score += 10; // 주의
    } else if (currentRatio >= 50) {
      score += 5; // 위험
    }
    // 50% 미만: 0점 (매우 위험)
  }

  // 3. 영업이익률 점수 (20점 만점)
  // 영업이익률 = (영업이익 / 매출액) × 100
  if (normalized.operating_profit !== null && normalized.revenue !== null && normalized.revenue !== 0n) {
    const operatingMargin = (Number(normalized.operating_profit) / Number(normalized.revenue)) * 100;

    if (operatingMargin >= 20) {
      score += 20; // 매우 우수
    } else if (operatingMargin >= 10) {
      score += 15; // 우수
    } else if (operatingMargin >= 5) {
      score += 10; // 보통
    } else if (operatingMargin >= 0) {
      score += 5; // 낮음
    }
    // 마이너스: 0점 (적자)
  }

  // 4. ROE 점수 (10점 만점)
  // ROE = (당기순이익 / 자본총계) × 100
  if (normalized.net_income !== null && normalized.total_equity !== null && normalized.total_equity !== 0n) {
    const roe = (Number(normalized.net_income) / Number(normalized.total_equity)) * 100;

    if (roe >= 15) {
      score += 10; // 매우 우수
    } else if (roe >= 10) {
      score += 8; // 우수
    } else if (roe >= 5) {
      score += 5; // 보통
    } else if (roe >= 0) {
      score += 3; // 낮음
    }
    // 마이너스: 0점 (적자)
  }

  // 최소 0, 최대 100 제한
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 리스크 점수 계산 및 저장
 *
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @param {Object} normalized - 정규화된 재무데이터
 * @returns {Object} 저장된 리스크 데이터
 */
export async function calculateAndSaveRiskScore(corpCode, bsnsYear, normalized) {
  try {
    // 1. 리스크 점수 계산
    const riskScore = calculateRiskScore(normalized);

    if (riskScore === null) {
      console.log(`[Risk Service] No financial data for ${corpCode} (${bsnsYear})`);
      return {
        corpCode,
        bsnsYear,
        riskScore: null
      };
    }

    // 2. DB에 저장 (UPSERT)
    const now = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 17); // yyyyMMddHHmmssfff
    const tblkey = uuidv4().replace(/-/g, '');

    const [existing] = await pool.query(
      'SELECT TBLKEY FROM DL_RISK_EVENTS WHERE corp_code = ? AND bsns_year = ?',
      [corpCode, bsnsYear]
    );

    if (existing.length > 0) {
      // UPDATE
      await pool.query(
        `UPDATE DL_RISK_EVENTS
         SET MODIFYDATE = ?, risk_score = ?
         WHERE corp_code = ? AND bsns_year = ?`,
        [now, riskScore, corpCode, bsnsYear]
      );
      console.log(`[Risk Service] Updated risk score for ${corpCode} (${bsnsYear}): score=${riskScore}`);
    } else {
      // INSERT
      await pool.query(
        `INSERT INTO DL_RISK_EVENTS (TBLKEY, ADDDATE, MODIFYDATE, corp_code, bsns_year, risk_score, event_type, event_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tblkey, now, now, corpCode, bsnsYear, riskScore, 'CALCULATED_SCORE', bsnsYear + '1231']
      );
      console.log(`[Risk Service] Inserted risk score for ${corpCode} (${bsnsYear}): score=${riskScore}`);
    }

    return {
      corpCode,
      bsnsYear,
      riskScore
    };
  } catch (error) {
    console.error(`[Risk Service] Error calculating risk score for ${corpCode}:`, error.message);
    return {
      corpCode,
      bsnsYear,
      riskScore: null,
      error: error.message
    };
  }
}

/**
 * DB에서 리스크 데이터 조회
 *
 * @param {string} corpCode - 기업 코드
 * @param {string} bsnsYear - 사업연도
 * @returns {Object|null} 리스크 데이터 또는 null
 */
export async function getRiskDataFromDB(corpCode, bsnsYear) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM DL_RISK_EVENTS WHERE corp_code = ? AND bsns_year = ? ORDER BY MODIFYDATE DESC LIMIT 1',
      [corpCode, bsnsYear]
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      corpCode: rows[0].corp_code,
      bsnsYear: rows[0].bsns_year,
      riskScore: rows[0].risk_score,
      eventCount: rows[0].event_count,
      lastUpdated: rows[0].MODIFYDATE
    };
  } catch (error) {
    console.error(`[Risk Service] Error fetching risk data from DB for ${corpCode}:`, error.message);
    return null;
  }
}
