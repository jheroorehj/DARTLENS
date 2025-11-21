// 변경: ① 최근연도 포함 5개년 수집 ② account_id/account_nm 길이 제한 유지

import pool from '../db.js';
import { getFnlttSinglAcntAll, getCompanyOutline } from './dartService.js';

function sanitize(s, max = 4000) {
  if (!s) return null;
  return String(s).replace(/\s+/g, ' ').trim().slice(0, max);
}

function sanitizeLen(s, max) {
  if (s == null) return null;
  return String(s).trim().slice(0, max);
}

async function logApi(endpoint, corp_code, params, status, duration_ms, error_msg) {
  await pool.execute(
    'INSERT INTO api_call_log (endpoint, corp_code, params, status, duration_ms, error_msg) VALUES (?,?,?,?,?,?)',
    [endpoint, corp_code, JSON.stringify(params ?? {}), status ?? null, duration_ms ?? null, error_msg ? String(error_msg).slice(0, 2000) : null]
  );
}

export async function loadListedCorps({ corp_code } = {}) {
  if (corp_code) {
    const [one] = await pool.query(
      'SELECT corp_code, corp_name, stock_code FROM corp_basic WHERE listed=1 AND corp_code=? LIMIT 1',
      [corp_code]
    );
    return one;
  }
  const [rows] = await pool.query(
    'SELECT corp_code, corp_name, stock_code FROM corp_basic WHERE listed=1'
  );
  return rows;
}

async function upsertOutline(corp, outline) {
  const overview = sanitize(outline?.business || outline?.bznsSumry || outline?.summary || outline?.companySummary);
  const products = sanitize(outline?.main_products || outline?.mnpr || outline?.product || outline?.mainProduct);
  await pool.execute(
    `INSERT INTO corp_outline (corp_code, stock_code, corp_name, business_overview, main_products, last_update)
     VALUES (?,?,?,?,?,NOW())
     ON DUPLICATE KEY UPDATE stock_code=VALUES(stock_code), corp_name=VALUES(corp_name),
       business_overview=VALUES(business_overview), main_products=VALUES(main_products), last_update=NOW()`,
    [corp.corp_code, corp.stock_code, corp.corp_name, overview, products]
  );
}

export async function upsertFinancials(corp, year, reprt_code, fs_div, data) {
  const list = Array.isArray(data?.list) ? data.list : [];
  if (!list.length) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sql = `INSERT INTO financial_reports
      (corp_code, stock_code, corp_name, bsns_year, reprt_code, fs_div, account_id, account_nm, thstrm_amount, frmtrm_amount, ord, last_update)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())
      ON DUPLICATE KEY UPDATE stock_code=VALUES(stock_code), corp_name=VALUES(corp_name),
        thstrm_amount=VALUES(thstrm_amount), frmtrm_amount=VALUES(frmtrm_amount),
        ord=VALUES(ord), last_update=NOW()`;

    for (const r of list) {
      const accId = sanitizeLen(r.account_id ?? r.sj_div ?? null, 191);
      const accNm = sanitizeLen(r.account_nm ?? r.sj_nm ?? null, 255);
      const vals = [
        corp.corp_code,
        corp.stock_code,
        corp.corp_name,
        String(year),
        reprt_code,
        fs_div,
        accId,
        accNm,
        r.thstrm_amount ?? null,
        r.frmtrm_amount ?? null,
        r.ord ?? r.order ?? null
      ];
      await conn.execute(sql, vals);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// ★ 변경 핵심: 최근 5개년 자동 수집
export async function ingestForAllListed({ fs_div = 'CFS', limit = null, corp_code = null } = {}) {
  const now = new Date();
  const latestYear = now.getMonth() <= 2 ? now.getFullYear() - 1 : now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => latestYear - 4 + i); // ex: 2021~2025
  const reprtCodes = ['11011', '11012', '11013', '11014'];

  const corps = await loadListedCorps({ corp_code });
  let processed = 0;

  for (const corp of corps) {
    if (limit && processed >= limit) break;
    for (const y of years) {
      for (const reprt_code of reprtCodes) {
        const t0 = Date.now();
        try {
          const fin = await getFnlttSinglAcntAll({
            corp_code: corp.corp_code,
            bsns_year: y,
            reprt_code,
            fs_div,
          });
          if (fin?.status !== '013') {
            await upsertFinancials(corp, y, reprt_code, fs_div, fin);
          }
          await logApi('fnlttSinglAcntAll.json', corp.corp_code,
            { corp_code: corp.corp_code, bsns_year: y, reprt_code, fs_div }, 200, Date.now() - t0, null);
        } catch (e) {
          await logApi('fnlttSinglAcntAll.json', corp.corp_code,
            { corp_code: corp.corp_code, bsns_year: y, reprt_code, fs_div }, 0, Date.now() - t0, e.message);
        }
      }

      // 회사 개요 1회만 갱신
      try {
        const outline = await getCompanyOutline({ corp_code: corp.corp_code });
        await upsertOutline(corp, outline);
      } catch (e) {
        await logApi('companyOutline.json', corp.corp_code, { corp_code: corp.corp_code }, 0, 0, e.message);
      }
    }
    processed += 1;
  }

  return { ok: true, processed, years, reprtCodes, fs_div };
}
