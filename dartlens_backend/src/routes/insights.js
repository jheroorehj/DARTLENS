// 변경 사항:
// 1) GET /:corp_code 기본 years=5 (최신연도 포함 5개년)
// 2) POST /sync 동기화 범위 최신연도 기준 5개년 × 4보고서 = 기대 20건
// 3) 2025 포함 자동 계산, 결측은 서비스 레이어(getSnapshots)에서 처리

import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import pool from "../db.js";
import { getSnapshots } from "../services/insights.js";
import { getFnlttSinglAcntAll } from "../services/dartService.js";
import { upsertFinancials } from "../services/ingestReports.js";

const router = Router();
router.use(requireAuth);

// 내부 유틸: 최신 회계연도(1~2월은 전기)
function latestFiscalYear() {
  const now = new Date();
  // 0=Jan,1=Feb,2=Mar -> 2 이하이면 전기 사업연도 사용
  return now.getMonth() <= 2 ? now.getFullYear() - 1 : now.getFullYear();
}
// 내부 유틸: 최신 포함 5개년 배열
function fiveYears() {
  const last = latestFiscalYear();
  return Array.from({ length: 5 }, (_, i) => last - 4 + i);
}
const REPRT_CODES = ["11011", "11012", "11013", "11014"];

// 인사이트 조회: 5개년 기본, reprt는 서비스에서 우선순위 처리 가능
router.get("/:corp_code", async (req, res) => {
  try {
    const { corp_code } = req.params;
    const years = Number(req.query.years || 5);      // 기본 5개년
    const reprt = String(req.query.reprt || "auto"); // "auto"면 서비스에서 11014>13>12>11 우선
    const fs = String(req.query.fs || "CFS");

    const [[corpRow]] = await pool.query(
      "SELECT corp_name FROM corp_basic WHERE corp_code=? LIMIT 1",
      [corp_code]
    );

    const snapshots = await getSnapshots({ corp_code, years, reprt, fs });
    res.json({
      ok: true,
      corp_code,
      corp_name: corpRow?.corp_name || "",
      snapshots,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: "insights 실패" });
  }
});

// 동기화: 최신연도 포함 5개년 × 11011~11014 = 20개 검사 후 누락 업서트
router.post("/sync", async (req, res) => {
  const { corp_code } = req.body || {};
  if (!corp_code) {
    return res.status(400).json({ ok: false, message: "corp_code 필요" });
  }

  const yearsArr = fiveYears(); // 예: [2021,2022,2023,2024,2025]
  const fsDiv = "CFS";
  const expectedCount = yearsArr.length * REPRT_CODES.length; // 5*4=20

  try {
    // 기업 메타
    const [[corp]] = await pool.query(
      "SELECT corp_code, corp_name, stock_code FROM corp_basic WHERE corp_code=? LIMIT 1",
      [corp_code]
    );
    if (!corp) {
      return res.status(404).json({ ok: false, message: "기업 없음" });
    }

    // 기존 보유 조합
    const yearMin = String(yearsArr[0]);
    const yearMax = String(yearsArr[yearsArr.length - 1]);

    const [rows] = await pool.query(
      `SELECT DISTINCT bsns_year, reprt_code
       FROM financial_reports
       WHERE corp_code=? AND fs_div=?
         AND bsns_year BETWEEN ? AND ?
         AND reprt_code IN (11011,11012,11013,11014)`,
      [corp_code, fsDiv, yearMin, yearMax]
    );

    const existing = new Set(rows.map((r) => `${r.bsns_year}-${r.reprt_code}`));

    // 누락 목록 작성
    const missing = [];
    for (const y of yearsArr) {
      for (const r of REPRT_CODES) {
        const k = `${y}-${r}`;
        if (!existing.has(k)) missing.push({ year: y, reprt_code: r });
      }
    }

    // 누락분 업서트
    const added = [];
    for (const m of missing) {
      try {
        const data = await getFnlttSinglAcntAll({
          corp_code,
          bsns_year: m.year,
          reprt_code: m.reprt_code,
          fs_div: fsDiv,
        });

        // status 013: 자료 없음 → 건너뜀(결측은 그대로 유지)
        if (data?.status === "013") continue;

        if (Array.isArray(data?.list) && data.list.length > 0) {
          await upsertFinancials(corp, String(m.year), m.reprt_code, fsDiv, data);
          added.push({ year: m.year, reprt_code: m.reprt_code });
        }
      } catch (e) {
        // 개별 실패는 계속 진행
        console.error("sync 실패:", corp_code, m, e.message || e);
      }
    }

    // 결과 요약
    const found = existing.size + added.length; // 근사치: 최초 상태 + 이번 추가
    const stillMissing = missing.filter(
      (m) => !added.find((a) => a.year === m.year && a.reprt_code === m.reprt_code)
    );

    res.json({
      ok: true,
      corp_code,
      years: yearsArr,              // 클라이언트 표시용
      reprtCodes: REPRT_CODES,      // 표시/검증용
      fs_div: fsDiv,
      expected: expectedCount,      // 20
      found,
      added,
      missing: stillMissing,        // 남은 누락(자료 자체가 없을 수 있음)
    });
  } catch (e) {
    console.error("동기화 오류:", e);
    res.status(500).json({ ok: false, message: "동기화 실패", error: e.message });
  }
});

export default router;
