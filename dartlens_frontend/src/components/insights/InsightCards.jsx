// src/components/insights/InsightCards.jsx
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { fmtEok, fmtPct } from "./utils.js";
import { INSIGHT_METRICS } from "../../constants/insightMetrics.js";

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
  const latestByKey = Object.fromEntries(
    INSIGHT_METRICS.map(({ key }) => [key, latestValid(withDerived, key)])
  );

  const seriesByKey = Object.fromEntries(
    INSIGHT_METRICS.map(({ key }) => [key, withDerived.map((r) => ({ x: r.year, y: r[key] }))])
  );

  const formatters = {
    eok: fmtEok,
    pct: fmtPct,
  };

  const resolveColor = (value, color) => {
    if (!color) return "text-gray-900";
    switch (color.type) {
      case "static":
        return color.value;
      case "opm":
        return colorOpm(value);
      case "nim":
        return colorNim(value);
      case "debt":
        return colorDebt(value);
      case "retained":
        return rateColor01(value, color.thresholds || [200, 100]);
      default:
        return "text-gray-900";
    }
  };

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
        {INSIGHT_METRICS.map((metric) => {
          const formatter = formatters[metric.format] || ((v) => v);
          const latest = latestByKey[metric.key];
          const series = seriesByKey[metric.key];
          return (
            <Card
              key={metric.key}
              title={metric.title}
              valueNode={fmtOrDash(formatter, latest)}
              series={series}
              colorClass={resolveColor(latest, metric.color)}
            />
          );
        })}
      </div>

      <div className="rounded-md border p-3">
        <div className="text-m mb-3">지표 설명과 기준</div>
        <ul className="text-xs space-y-5 text-gray-700">
          {INSIGHT_METRICS.map((metric) => (
            <li key={metric.key}>
              <div className="font-medium text-gray-900">
                {metric.explanation?.heading}
                {metric.explanation?.ranges?.length ? (
                  <>
                    (
                    {metric.explanation.ranges.map((range, idx) => (
                      <span key={idx} className={range.className}>
                        {range.text}
                      </span>
                    ))}
                    )
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border p-3">
        <div className="text-m mb-2">해석 흐름</div>
        <p className="text-xs text-gray-700">매출 증가 → 이익률 개선 → 유보율 확대 → 부채 축소 → 재무 안정성 상승</p>
      </div>
    </section>
  );
}
