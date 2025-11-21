import { Router } from 'express';
import pool from '../db.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth); // req.user.id 사용

// GET /api/wishlist  내 목록 조회
router.get('/', async (req, res) => {
  const uid = req.user.id;
  const [rows] = await pool.query(
   `SELECT w.id, w.corp_code, w.alias, w.priority, w.created_at,
            cb.corp_name, cb.stock_code
       FROM wishlist w
       JOIN corp_basic cb ON cb.corp_code = w.corp_code
      WHERE w.user_id=?
      ORDER BY w.priority DESC, w.created_at DESC`,
    [uid]
  );
  res.json({ ok: true, items: rows });
});

// POST /api/wishlist  { corp_code } 추가
router.post('/', async (req, res) => {
  const uid = req.user.id;
  const { corp_code } = req.body || {};
  if (!/^\d{8}$/.test(String(corp_code || '')))
    return res.status(400).json({ ok: false, message: 'corp_code 8자리 필요' });

  await pool.query(
    `INSERT INTO wishlist (user_id, corp_code, created_at)
     VALUES (?,?,NOW())
     ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)`,
    [uid, corp_code]
  );
  res.json({ ok: true });
});

// DELETE /api/wishlist/:corp_code  항목 제거
router.delete('/:corp_code', async (req, res) => {
  const uid = req.user.id;
  const cc = req.params.corp_code;
  await pool.query(`DELETE FROM wishlist WHERE user_id=? AND corp_code=?`, [uid, cc]);
  res.json({ ok: true });
});

export default router;
