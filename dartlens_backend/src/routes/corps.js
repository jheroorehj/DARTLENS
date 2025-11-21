import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * GET /api/corps/search?query=키워드&limit=20
 * - 대상: 상장사(listed=1)
 * - 필드: corp_name, corp_code, stock_code
 */
router.get('/search', async (req, res) => {
  const q = (req.query.query || req.query.q || '').trim();
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? '20', 10)));
  if (!q) return res.json({ ok: true, items: [] });

  // 와일드카드 준비
  const like = `%${q}%`;
  const prefix = `${q}%`; // 코드 앞자리 검색 가속용

  const sql = `
    SELECT corp_name, corp_code, stock_code
    FROM corp_basic
    WHERE listed=1
      AND (
           corp_name LIKE ?
        OR corp_code LIKE ?
        OR stock_code LIKE ?
      )
    ORDER BY
      -- 이름 정확/부분 일치 우선
      CASE
        WHEN corp_name = ? THEN 0
        WHEN corp_name LIKE ? THEN 1
        ELSE 2
      END,
      corp_name
    LIMIT ?
  `;
  const params = [like, prefix, prefix, q, like, limit];

  try {
    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, items: rows });
  } catch (e) {
    res.status(500).json({ ok: false, message: '검색 실패', error: e.message });
  }
});

export default router;
