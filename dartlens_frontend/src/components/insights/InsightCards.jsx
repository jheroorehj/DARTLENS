// src/components/insights/InsightCards.jsx
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { fmtEok, fmtPct } from "./utils.js";

function colorOpm(v) {
  if (v == null) return "text-gray-400";
  return v >= 10 ? "text-green-600" : v >= 5 ? "text-yellow-600" : "text-red-600";
}
function colorNim(v) {
  if (v == null) return "text-gray-400";
  return v >= 8 ? "text-green-600" : v >= 3 ? "text-yellow-600" : "text-red-600";
}
function colorDebt(v) {
  if (v == null) return "text-gray-400";
  return v <= 100 ? "text-blue-600" : v <= 200 ? "text-green-600" : v <= 300 ? "text-yellow-600" : "text-red-600";
}
function rateColor01(v, [good, warn]) {
  if (v == null) return "text-gray-400";
  return v >= good ? "text-green-600" : v >= warn ? "text-yellow-600" : "text-red-600";
}

// null 안전 포맷
const fmtOrDash = (fn, v) => (v == null ? "-" : fn(v));

// 가장 최근 유효값 선택
function latestValid(arr, key) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i]?.[key];
    if (v != null) return v;
  }
  return null;
}

export default function InsightCards({ rows = [] }) {
  // 파생치 보정: 백엔드 제공값 우선, 없으면 자체 계산
  const withDerived = rows.map((r) => {
    const rev = r.revenue ?? null;
    const op = r.op ?? null;
    const ni = r.ni ?? null;
    const equity = r.equity ?? null;
    const liabilities = r.liab ?? r.liabilities ?? null;
    const retained = r.retained ?? null;

    const opm = r.op_margin ?? (rev != null && op != null ? (op / rev) * 100 : null);
    const nim = r.ni_margin ?? (rev != null && ni != null ? (ni / rev) * 100 : null);
    const debt = r.debt_ratio ?? (equity != null && equity !== 0 && liabilities != null ? (liabilities / equity) * 100 : null);
    const retain = r.retained_ratio ?? (equity != null && equity !== 0 && retained != null ? (retained / equity) * 100 : null);

    return {
      year: r.year,
      revenue: rev,
      op_margin: opm,
      ni_margin: nim,
      debt_ratio: debt,
      retained_ratio: retain,
    };
  });

  // 최신 유효값으로 카드 상단 수치 표시
  const latestRevenue = latestValid(withDerived, "revenue");
  const latestOpM = latestValid(withDerived, "op_margin");
  const latestNiM = latestValid(withDerived, "ni_margin");
  const latestDebt = latestValid(withDerived, "debt_ratio");
  const latestRetain = latestValid(withDerived, "retained_ratio");

  // 시계열: null 유지 → 라인 끊김 처리
  const sRevenue = withDerived.map((r) => ({ x: r.year, y: r.revenue }));
  const sOpM = withDerived.map((r) => ({ x: r.year, y: r.op_margin }));
  const sNiM = withDerived.map((r) => ({ x: r.year, y: r.ni_margin }));
  const sDebt = withDerived.map((r) => ({ x: r.year, y: r.debt_ratio }));
  const sRetain = withDerived.map((r) => ({ x: r.year, y: r.retained_ratio }));

  const Card = ({ title, valueNode, series, colorClass, foot }) => (
    <div className="rounded border p-3 flex flex-col gap-2">
      <div className="text-xs text-gray-500">{title}</div>
      <div className={`text-base ${colorClass}`}>{valueNode}</div>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            {/* 툴팁: 연도와 값 표시. 점(dot)은 그대로 비활성 */}
            <Tooltip
              formatter={(value) => [value.toLocaleString(), ""]}
              contentStyle={{ fontSize: 12, padding: "4px 6px" }}
              wrapperStyle={{ outline: "none" }}
            />
            <Line type="monotone" dataKey="y" dot={false} strokeWidth={1} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {foot ? <div className="text-[11px] text-gray-500">{foot}</div> : null}
    </div>
  );

  return (
    <section className="card-surface space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card
          title="매출액"
          valueNode={fmtOrDash(fmtEok, latestRevenue)}
          series={sRevenue}
          colorClass="text-gray-900"
        />
        <Card
          title="영업이익률"
          valueNode={fmtOrDash(fmtPct, latestOpM)}
          series={sOpM}
          colorClass={colorOpm(latestOpM)}
        />
        <Card
          title="순이익률"
          valueNode={fmtOrDash(fmtPct, latestNiM)}
          series={sNiM}
          colorClass={colorNim(latestNiM)}
        />
        <Card
          title="부채비율"
          valueNode={fmtOrDash(fmtPct, latestDebt)}
          series={sDebt}
          colorClass={colorDebt(latestDebt)}
        />
        <Card
          title="유보율"
          valueNode={fmtOrDash(fmtPct, latestRetain)}
          series={sRetain}
          colorClass={rateColor01(latestRetain, [200, 100])}
        />
      </div>

      <div className="rounded-md border p-3">
        <div className="text-m mb-3">지표 설명과 기준</div>
        <ul className="text-xs space-y-5 text-gray-700">
          <li>
            <div className="font-medium text-gray-900">매출액: 기업 규모와 성장성</div>
          </li>
          <li>
            <div className="font-medium text-gray-900">
              영업이익률: 본업 수익성(
              <span className="text-green-600">10% 이상</span>
              <span className="text-yellow-600"> 5~10%</span>
              <span className="text-red-600"> 5% 미만</span>)
            </div>
          </li>
          <li>
            <div className="font-medium text-gray-900">
              순이익률: 전체 경영 효율(
              <span className="text-green-600">8% 이상</span>
              <span className="text-yellow-600"> 3~8%</span>
              <span className="text-red-600"> 3% 미만</span>)
            </div>
          </li>
          <li>
            <div className="font-medium text-gray-900">
              부채비율: 재무 건전성(
              <span className="text-blue-600">100% 이하</span>
              <span className="text-green-600"> 100~200%</span>
              <span className="text-yellow-600"> 200~300%</span>
              <span className="text-red-600"> 300% 이상</span>)
            </div>
          </li>
          <li>
            <div className="font-medium text-gray-900">
              유보율: 내부 자본 축적력(
              <span className="text-green-600">200% 이상</span>
              <span className="text-yellow-600"> 100~200%</span>
              <span className="text-red-600"> 100% 미만</span>)
            </div>
          </li>
        </ul>
      </div>

      <div className="rounded-md border p-3">
        <div className="text-m mb-2">해석 흐름</div>
        <p className="text-xs text-gray-700">매출 증가 → 이익률 개선 → 유보율 확대 → 부채 축소 → 재무 안정성 상승</p>
      </div>
    </section>
  );
}
