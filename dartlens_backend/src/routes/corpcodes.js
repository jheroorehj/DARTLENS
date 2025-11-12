// PROTO/dartlens_backend/src/routes/corpcodes.js
import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import pool from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js"; // X-Admin-Token 검사(기존과 동일 정책 가정)


const router = Router();

// JSON → stage 로드 → corp_basic 업서트 → 삭제 반영
router.post("/import-json", requireAdmin, async (req, res) => {
  try {
    const jsonPath = path.resolve(process.cwd(), "scripts", "corpcodes_listed.json");
    const raw = await fs.readFile(jsonPath, "utf-8");
    const j = JSON.parse(raw);
    const items = Array.isArray(j.items) ? j.items : [];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) stage 초기화
      await conn.query("TRUNCATE TABLE corp_basic_stage");

      // 2) stage 벌크 인서트
      if (items.length > 0) {
        const vals = items.map(it => [
          it.corp_code, it.corp_name, it.stock_code || null, 1
        ]);
        await conn.query(
          `INSERT INTO corp_basic_stage (corp_code, corp_name, stock_code, listed)
           VALUES ?`,
          [vals]
        );
      }

      // 3) corp_basic 업서트
      await conn.query(
        `INSERT INTO corp_basic (corp_code, corp_name, corp_eng_name, stock_code, listed, modify_date, last_sync_at)
         SELECT s.corp_code, s.corp_name, NULL, s.stock_code, 1, NULL, NOW()
         FROM corp_basic_stage s
         ON DUPLICATE KEY UPDATE
           corp_name=VALUES(corp_name),
           stock_code=VALUES(stock_code),
           listed=VALUES(listed),
           last_sync_at=NOW()`
      );

      // 4) 목록에서 사라진 상장사 처리: 기존 listed=1인데 stage에 없는 경우 → listed=0, stock_code NULL
      await conn.query(
        `UPDATE corp_basic cb
           LEFT JOIN corp_basic_stage s ON s.corp_code = cb.corp_code
         SET cb.listed=0,
             cb.stock_code=NULL,
             cb.last_sync_at=NOW()
         WHERE cb.listed=1 AND s.corp_code IS NULL`
      );

      await conn.commit();
      res.json({ ok: true, imported: items.length });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ ok: false, message: "import 실패", error: String(e.message || e) });
  }
});

export default router;
