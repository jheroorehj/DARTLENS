// 목적: OpenDART만으로 5개년 스냅샷 생성(결측 허용) + reprt=auto 우선순위
// 공개 함수: getSnapshots({ corp_code, years=5, reprt='auto', fs='CFS' })

import pool from "../db.js";

// ===== 유틸 =====
function latestFiscalYear() {
  const now = new Date();
  // 0=Jan,1=Feb,2=Mar → 3월 이전에는 전기 사업연도 사용
  return now.getMonth() <= 2 ? now.getFullYear() - 1 : now.getFullYear();
}
function buildYears(n = 5) {
  const last = latestFiscalYear();
  const k = Math.max(1, Math.min(10, Number(n) || 5)); // 안전 범위 1~10
  return Array.from({ length: k }, (_, i) => last - (k - 1) + i);
}
// 금액 문자열 → 숫자(null 허용)
function toNum(x) {
  if (x == null) return null;
  const s = String(x).replace(/,/g, "").trim();
  if (!s || s === "-") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}
function pctDiv(a, b) {
  if (a == null || b == null) return null;
  if (b === 0) return null;
  return (a / b) * 100;
}

const REPRT_PRIORITY = ["11014", "11013", "11012", "11011"];

// 내부: 특정 연도 데이터 읽기
async function fetchYearRows({ corp_code, year, fs, reprt }) {
  if (reprt && reprt !== "auto") {
    const [rows] = await pool.query(
      `SELECT bsns_year, reprt_code, account_id, account_nm, thstrm_amount
         FROM financial_reports
        WHERE corp_code=? AND fs_div=? AND bsns_year=? AND reprt_code=?
        ORDER BY ord ASC`,
      [corp_code, fs, String(year), String(reprt)]
    );
    return { year, reprt_code: rows[0]?.reprt_code ?? null, rows };
  }

  // auto: 우선순위 높은 보고서 하나 선택 후 그 코드의 계정만 사용
  const [rows] = await pool.query(
    `SELECT bsns_year, reprt_code, account_id, account_nm, thstrm_amount
       FROM financial_reports
      WHERE corp_code=? AND fs_div=? AND bsns_year=? AND reprt_code IN (?,?,?,?)
      ORDER BY FIELD(reprt_code, ?, ?, ?, ?) ASC, ord ASC`,
    [corp_code, fs, String(year), ...REPRT_PRIORITY, ...REPRT_PRIORITY]
  );
  if (!rows.length) return { year, reprt_code: null, rows: [] };
  const chosen = rows[0].reprt_code;
  return { year, reprt_code: chosen, rows: rows.filter(r => r.reprt_code === chosen) };
}

// 내부: 계정 추출
function extractCoreAccounts(rows) {
  const m = new Map();
  for (const r of rows) m.set(r.account_id, toNum(r.thstrm_amount));

  const pick = (ids) => {
    for (const k of ids) if (m.has(k)) return m.get(k);
    return null;
  };

  const revenue = pick(["ifrs-full_Revenue", "ifrs-full_SalesRevenue"]);
  const op =
    pick(["ifrs-full_OperatingProfitLoss", "ifrs-full_ProfitLossFromOperatingActivities", "dart_OperatingProfitLoss", "dart_OperatingIncomeLoss"]) ??
    null;
  const ni =
    pick(["ifrs-full_ProfitLossAttributableToOwnersOfParent"]) ??
    pick(["ifrs-full_ProfitLoss"]);
  const liabilities = pick(["ifrs-full_Liabilities"]);
  const equity =
    pick(["ifrs-full_EquityAttributableToOwnersOfParent"]) ??
    pick(["ifrs-full_Equity"]);
  const retained = pick(["ifrs-full_RetainedEarnings"]);
  const capital = pick(["ifrs-full_IssuedCapital"]);

  return { revenue, op, ni, liabilities, equity, retained, capital };
}

// ===== 공개: 스냅샷 =====
export async function getSnapshots({ corp_code, years = 5, reprt = "auto", fs = "CFS" }) {
  const yearsList = buildYears(years); // 예: [2021..2025]
  const out = [];

  for (const y of yearsList) {
    const { reprt_code, rows } = await fetchYearRows({ corp_code, year: y, fs, reprt });

    if (!rows.length) {
      out.push({
        year: y,
        reprt_code: null,
        revenue: null,
        op: null,
        ni: null,
        liabilities: null,
        equity: null,
        retained: null,
        capital: null,
        op_margin: null,
        ni_margin: null,
        debt_ratio: null,
        retained_ratio: null,
      });
      continue;
    }

    const a = extractCoreAccounts(rows);
    out.push({
      year: y,
      reprt_code,
      revenue: a.revenue,
      op: a.op,
      ni: a.ni,
      liabilities: a.liabilities,
      equity: a.equity,
      retained: a.retained,
      capital: a.capital,
      op_margin: pctDiv(a.op, a.revenue),
      ni_margin: pctDiv(a.ni, a.revenue),
      debt_ratio: pctDiv(a.liabilities, a.equity),
      retained_ratio: pctDiv(a.retained, a.capital),
    });
  }

  // 연도 오름차순 정렬
  out.sort((a, b) => Number(a.year) - Number(b.year));
  return out;
}
