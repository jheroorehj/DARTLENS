// OpenDART API Service - V2.0 Simplified
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const API_BASE = 'https://opendart.fss.or.kr/api';
const API_KEY = process.env.DART_API_KEY;

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

// Simple rate limiting: minimum 700ms between requests (max ~85 requests/min)
let lastCallTime = 0;
const MIN_INTERVAL = 700;

async function rateLimitedCall(endpoint, params = {}, timeout = 15000) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - timeSinceLastCall));
  }

  lastCallTime = Date.now();

  const axiosConfig = {
    params: { crtfc_key: API_KEY, ...params },
    timeout
  };

  if (proxyAgent) {
    axiosConfig.proxy = false; // 직접 설정한 프록시 에이전트 사용
    axiosConfig.httpAgent = proxyAgent;
    axiosConfig.httpsAgent = proxyAgent;
  }

  return axios.get(`${API_BASE}/${endpoint}`, axiosConfig);
}

/**
 * 단일회사 전체 재무제표 조회
 * @param {string} corp_code - 기업코드 (8자리)
 * @param {string} bsns_year - 사업연도 (yyyy)
 * @param {string} reprt_code - 보고서 코드 (11011~11014)
 * @param {string} fs_div - 재무제표 구분 (CFS/OFS)
 */
export async function getFnlttSinglAcntAll({ corp_code, bsns_year, reprt_code = '11014', fs_div = 'CFS' }) {
  try {
    const res = await rateLimitedCall('fnlttSinglAcntAll.json', {
      corp_code,
      bsns_year,
      reprt_code,
      fs_div
    });

    const data = res.data;

    // DART API error handling
    if (data?.status && data.status !== '000' && data.status !== '013') {
      const err = new Error(`DART API Error: status=${data.status} message=${data.message}`);
      err.dartStatus = data.status;
      err.dartMessage = data.message;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('[DART Service] getFnlttSinglAcntAll error:', error.message);
    throw error;
  }
}

/**
 * 기업개황 조회
 * @param {string} corp_code - 기업코드 (8자리)
 */
export async function getCompanyOutline({ corp_code }) {
  try {
    const res = await rateLimitedCall('company.json', { corp_code });
    const data = res.data;

    if (data?.status && data.status !== '000' && data.status !== '013') {
      const err = new Error(`DART API Error: status=${data.status} message=${data.message}`);
      err.dartStatus = data.status;
      err.dartMessage = data.message;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('[DART Service] getCompanyOutline error:', error.message);
    throw error;
  }
}

/**
 * 주식 총수 현황 조회
 * @param {string} corp_code - 기업코드 (8자리)
 * @param {string} bsns_year - 사업연도 (yyyy)
 * @param {string} reprt_code - 보고서 코드 (11011~11014)
 */
export async function getStockTotalStatus({ corp_code, bsns_year, reprt_code = '11014' }) {
  try {
    const res = await rateLimitedCall('stockTotqySttus.json', {
      corp_code,
      bsns_year,
      reprt_code
    });

    const data = res.data;

    if (data?.status && data.status !== '000' && data.status !== '013') {
      const err = new Error(`DART API Error: status=${data.status} message=${data.message}`);
      err.dartStatus = data.status;
      err.dartMessage = data.message;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('[DART Service] getStockTotalStatus error:', error.message);
    throw error;
  }
}

/**
 * 배당 정보 조회
 * @param {string} corp_code - 기업코드 (8자리)
 * @param {string} bsns_year - 사업연도 (yyyy)
 * @param {string} reprt_code - 보고서 코드 (11011~11014)
 */
export async function getDividendInfo({ corp_code, bsns_year, reprt_code = '11014' }) {
  try {
    const res = await rateLimitedCall('alotMatter.json', {
      corp_code,
      bsns_year,
      reprt_code
    });

    const data = res.data;

    if (data?.status && data.status !== '000' && data.status !== '013') {
      const err = new Error(`DART API Error: status=${data.status} message=${data.message}`);
      err.dartStatus = data.status;
      err.dartMessage = data.message;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('[DART Service] getDividendInfo error:', error.message);
    throw error;
  }
}

/**
 * 리스크 이벤트 조회 (부도/회생/감사의견/소송 등)
 * TODO: Implement risk event fetching
 */
export async function getRiskEvents({ corp_code }) {
  // Placeholder for V2.0
  return { list: [] };
}

/**
 * 거버넌스 데이터 조회 (대주주 현황)
 * TODO: Implement governance data fetching
 */
export async function getGovernanceData({ corp_code }) {
  // Placeholder for V2.0
  return { list: [] };
}

/**
 * 배당 데이터 조회
 * TODO: Implement dividend data fetching
 */
export async function getDividendData({ corp_code }) {
  // Placeholder for V2.0
  return { list: [] };
}
