// PROTO/dartlens_backend/src/jobs/corpcodes.job.js
// Node-only 스케줄러(배포시 파이썬 미사용 경로). CORPCODE.zip을 직접 받아 DB에 반영.
import axios from "axios";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import pool from "../db.js";

export async function runCorpcodesSyncDirect() {
  const { data: zipBuf } = await axios.get("https://opendart.fss.or.kr/api/corpCode.xml", {
    params: { crtfc_key: process.env.DART_API_KEY },
    responseType: "arraybuffer",
    timeout: 20000,
  });

  const zip = await JSZip.loadAsync(Buffer.from(zipBuf));
  const entry = zip.file(/CORPCODE\.xml$/i)[0];
  if (!entry) throw new Error("CORPCODE.xml 없음");
  const xml = await entry.async("string");

  const parser = new XMLParser({ trimValues: true, ignoreAttributes: true, isArray: (n) => n === "list" });
  const obj = parser.parse(xml);
  const lists = obj?.result?.list ?? [];
  const items = lists
    .map((it) => ({
      corp_code: String(it?.corp_code || "").trim(),
      corp_name: String(it?.corp_name || "").trim(),
      stock_code: String(it?.stock_code || "").trim(),
    }))
    .filter((x) => /^\d{8}$/.test(x.corp_code) && /^\d{6}$/.test(x.stock_code));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("TRUNCATE TABLE corp_basic_stage");

    if (items.length) {
      await conn.query(
        `INSERT INTO corp_basic_stage (corp_code, corp_name, stock_code, listed)
         VALUES ?`,
        [items.map((x) => [x.corp_code, x.corp_name, x.stock_code, 1])]
      );
    }

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

    await conn.query(
      `UPDATE corp_basic cb
         LEFT JOIN corp_basic_stage s ON s.corp_code = cb.corp_code
       SET cb.listed=0, cb.stock_code=NULL, cb.last_sync_at=NOW()
       WHERE cb.listed=1 AND s.corp_code IS NULL`
    );

    await conn.commit();
    return { ok: true, imported: items.length };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
