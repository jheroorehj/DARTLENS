// src/routes/admin.js
import { Router } from 'express';
import pool from '../db.js';
import { ingestForAllListed } from '../services/ingestReports.js';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

const router = Router();

// 관리자 토큰 가드
router.use((req, res, next) => {
  const token = req.get('X-Admin-Token');
  if (token && token === process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ ok: false, message: '관리자 인증 필요' });
});

// CORPCODE.xml 동기화: ZIP → XML → 파싱 → corp_basic 업서트
router.post('/corpcode/sync', async (_req, res) => {
  try {
    // 1) ZIP 다운로드
    const { data: zipBuf } = await axios.get('https://opendart.fss.or.kr/api/corpCode.xml', {
      params: { crtfc_key: process.env.DART_API_KEY },
      responseType: 'arraybuffer',
      timeout: 20000,
    });

    // 2) ZIP 해제(JSZip)
    const zip = await JSZip.loadAsync(Buffer.from(zipBuf));
    const entry = zip.file(/CORPCODE\.xml$/i)[0];
    if (!entry) return res.status(500).json({ ok: false, message: 'CORPCODE.xml 없음' });

    const xml = await entry.async('string');

    // 3) XML 파싱(항상 list를 배열로)
    const parser = new XMLParser({
      trimValues: true,
      ignoreAttributes: true,
      parseTagValue: false,
      isArray: (name) => name === 'list',
    });
    const obj = parser.parse(xml);

    const S = (v) => (typeof v === 'string' ? v : (v == null ? '' : String(v))).trim();
    const lists = obj?.result?.list ?? [];

    if (!Array.isArray(lists) || lists.length === 0) {
      return res.json({
        ok: false,
        status: S(obj?.result?.status),
        message: S(obj?.result?.message),
        total: 0
      });
    }

    // 첫 행 파싱 미리 기록(응답에 그대로 보여줌)
    const firstParsed = lists[0] || {};
    let fr_cc = S(firstParsed?.corp_code);
    if (/^\d+$/.test(fr_cc)) fr_cc = fr_cc.padStart(8,'0');
    let fr_sc = S(firstParsed?.stock_code);
    if (/^\d+$/.test(fr_sc)) fr_sc = fr_sc.padStart(6,'0');
    const first_row = {
    corp_code: fr_cc,
    corp_name: S(firstParsed?.corp_name),
    stock_code: fr_sc,
    listed: /^\d{6}$/.test(fr_sc) ? 1 : 0,
    modify_date: S(firstParsed?.modify_date),
    };    

    // 4) DB 업서트
    let total = 0, listed = 0;
    let first_saved = null;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const sql = `
        INSERT INTO corp_basic
          (corp_code, corp_name, corp_eng_name, stock_code, listed, modify_date, last_sync_at)
        VALUES (?,?,?,?,?,?,NOW())
        ON DUPLICATE KEY UPDATE
          corp_name=VALUES(corp_name),
          corp_eng_name=VALUES(corp_eng_name),
          stock_code=VALUES(stock_code),
          listed=VALUES(listed),
          modify_date=VALUES(modify_date),
          last_sync_at=NOW()
      `;

      for (const it of lists) {
        let corp_code = S(it?.corp_code);
        if (/^\d+$/.test(corp_code)) corp_code = corp_code.padStart(8, '0');
        if (!/^\d{8}$/.test(corp_code)) continue;

        const corp_name = S(it?.corp_name);
        const corp_eng_name = S(it?.corp_eng_name);

        let stock_code_raw = S(it?.stock_code);
        if (/^\d+$/.test(stock_code_raw)) stock_code_raw = stock_code_raw.padStart(6,'0');
        const stock_code = /^\d{6}$/.test(stock_code_raw) ? stock_code_raw : null;

        const isListed = stock_code ? 1 : 0;

        const md = S(it?.modify_date);
        const modify_date = /^\d{8}$/.test(md) ? `${md.slice(0,4)}-${md.slice(4,6)}-${md.slice(6,8)}` : null;

        await conn.execute(sql, [
          corp_code, corp_name, corp_eng_name, stock_code, isListed, modify_date
        ]);

        // 첫 성공 건을 응답에 기록
        if (!first_saved) {
          first_saved = {
            corp_code,
            corp_name,
            stock_code,
            listed: isListed,
            modify_date: md,
          };
        }

        total += 1;
        if (isListed) listed += 1;
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return res.json({ 
        ok: true, 
        total, 
        listed, 
        non_listed: total - listed, 
        first_row,
        first_saved,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: '동기화 실패', error: String(e.message || e) });
  }
});

// 수동 실행: 분기 인제스트
// POST /api/admin/ingest?year=2024&reprt_code=11014&fs_div=CFS&limit=100
router.post('/ingest', async (req, res) => {
  try {
    const { year, reprt_code, fs_div, limit, corp_code } = { ...req.query, ...req.body };
    const result = await ingestForAllListed({
      year: year?.toString(),
      reprt_code: reprt_code || '11014',
      fs_div: fs_div || 'CFS',
      limit: limit ? Number(limit) : null,
      corp_code: corp_code || null
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: '실패', error: e.message });
  }
});

// 헬스체크 및 건수 확인
router.get('/stats', async (_req, res) => {
  const [[c1]] = await pool.query('SELECT COUNT(*) AS cnt FROM corp_basic WHERE listed=1');
  const [[c2]] = await pool.query('SELECT COUNT(*) AS cnt FROM financial_reports');
  res.json({ ok: true, listed_corps: c1.cnt, facts: c2.cnt });
});

export default router;
