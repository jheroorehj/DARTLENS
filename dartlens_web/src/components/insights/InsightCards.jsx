import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { FORMATTERS, resolveColor, getLatestValid } from "./utils";
import { INSIGHT_METRICS } from "../../constants/insightMetrics";
import { safeFormat } from "../../utils/formatters";
import { safeToNumber } from "../../utils/numberUtils";
import ExecutiveSummary from "./ExecutiveSummary";

export default function InsightCards({ rows = [] }) {
  const sortedRows = [...rows].sort((a, b) => {
    const aYear = safeToNumber(a?.year ?? a?.bsnsYear ?? a?.bsns_year, -Infinity);
    const bYear = safeToNumber(b?.year ?? b?.bsnsYear ?? b?.bsns_year, -Infinity);
    return aYear - bYear;
  }); // 수정 이유: 연도 정렬을 강제하여 성장성/수익성 스파크라인 왜곡 방지

  /**
   * Process backend data to extract KPI values
   *
   * Backend provides KPIs directly in the `kpis` object.
   * Frontend only needs to extract and display them.
   */
  const processedData = sortedRows.map((row) => {
    // Backend provides KPIs directly - use them as-is
    const kpis = row?.kpis || row || {}; // Fallback for legacy structure

    return {
      year: row?.year ?? row?.bsnsYear ?? row?.bsns_year ?? "",
      // Financial KPIs (6)
      roe: safeToNumber(kpis.roe),
      debtRatio: safeToNumber(kpis.debtRatio),
      currentRatio: safeToNumber(kpis.currentRatio),
      operatingMargin: safeToNumber(kpis.operatingMargin),
      revenueGrowth: safeToNumber(kpis.revenueGrowth),
      eps: safeToNumber(kpis.eps),
      // Non-Financial Metrics (3)
      riskScore: safeToNumber(kpis.riskScore),
      governanceScore: safeToNumber(kpis.governanceScore),
      dividendPerShare: safeToNumber(kpis.dividendPerShare),
    };
  });

  /**
   * Extract latest valid value for each metric
   *
   * Used to display current metric values in cards
   */
  const latestValues = {};
  INSIGHT_METRICS.forEach((metric) => {
    latestValues[metric.key] = getLatestValid(processedData, metric.key);
  });

  /**
   * Build time series data for charts
   *
   * Format: [{ x: year, y: value }, ...]
   */
  const timeSeriesData = {};
  INSIGHT_METRICS.forEach((metric) => {
    timeSeriesData[metric.key] = processedData.map((row) => ({
      x: row.year,
      y: row[metric.key],
    }));
  });

  /**
   * MetricCard Component
   *
   * Individual card displaying a single financial metric
   */
  function MetricCard({ title, value, series, colorClass, footer }) {
    return (
      <div className="metric-card">
        {/* Card title */}
        <div className="metric-card-title">{title}</div>

        {/* Card value with color coding */}
        <div className={`metric-card-value ${colorClass}`}>{value}</div>

        {/* Sparkline chart */}
        <div className="metric-card-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <Tooltip
                formatter={(value) => {
                  if (value === null || value === undefined) return ['N/A', ''];
                  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
                  return [num.toLocaleString(), ''];
                }}
                contentStyle={{ fontSize: 12, padding: "4px 6px" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Line
                type="monotone"
                dataKey="y"
                dot={false}
                strokeWidth={1}
                connectNulls={false}
                stroke="currentColor"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Optional footer */}
        {footer && <div className="metric-card-footer">{footer}</div>}
      </div>
    );
  }

  // Extract latest KPIs for Executive Summary (most recent valid values)
  const latestKpis = processedData.length > 0
    ? {
        roe: latestValues.roe,
        debtRatio: latestValues.debtRatio,
        currentRatio: latestValues.currentRatio,
        operatingMargin: latestValues.operatingMargin,
        revenueGrowth: latestValues.revenueGrowth,
        eps: latestValues.eps,
        riskScore: latestValues.riskScore,
        governanceScore: latestValues.governanceScore,
        dividendPerShare: latestValues.dividendPerShare,
      }
    : null;

  return (
    <section className="card-surface insight-cards">
      <div className="insight-cards-content">
        {/* Tier 1: Executive Summary */}
        <ExecutiveSummary latestKpis={latestKpis} kpiHistory={processedData} />

        {/* Tier 3: Metrics grid */}
        <div className="metrics-grid">
          {INSIGHT_METRICS.map((metric) => {
            const formatter = FORMATTERS[metric.format] || ((v) => v);
            const latestValue = latestValues[metric.key];
            const series = timeSeriesData[metric.key];
            const colorClass = resolveColor(latestValue, metric.color);

            return (
              <MetricCard
                key={metric.key}
                title={metric.title}
                value={safeFormat(formatter, latestValue)}
                series={series}
                colorClass={colorClass}
              />
            );
          })}
        </div>

        {/* Explanation section */}
        <div className="metrics-explanation">
          <div className="metrics-explanation-title">지표 설명과 기준</div>
          <ul className="metrics-explanation-list">
            {INSIGHT_METRICS.map((metric) => (
              <li key={metric.key} className="metrics-explanation-item">
                <div className="metrics-explanation-heading">
                  {metric.explanation?.heading}
                  {metric.explanation?.ranges?.length > 0 && (
                    <span className="metrics-explanation-ranges">
                      {" ("}
                      {metric.explanation.ranges.map((range, idx) => (
                        <span
                          key={idx}
                          className={`metrics-explanation-range ${range.className}`}
                        >
                          {range.text}
                        </span>
                      ))}
                      {")"}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Interpretation flow */}
        <div className="metrics-interpretation">
          <div className="metrics-interpretation-title">해석 흐름</div>
          <p className="metrics-interpretation-text">
            리스크 점수 우수 → 거버넌스 안정 → 매출성장률 양호 → 영업이익률 개선 → ROE 상승 → EPS 증가 → 유동비율 증가 → 부채비율 감소 → 배당 지급 → 재무 안정성 강화
          </p>
        </div>
      </div>
    </section>
  );
}
