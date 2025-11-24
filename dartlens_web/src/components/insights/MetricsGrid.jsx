import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { FORMATTERS, resolveColor, getLatestValid } from "./utils";
import { INSIGHT_METRICS } from "../../constants/insightMetrics";
import { safeFormat } from "../../utils/formatters";
import { safeToNumber } from "../../utils/numberUtils";

export default function MetricsGrid({ rows = [] }) {
  // Toggle state for metric explanations
  const [showExplanations, setShowExplanations] = useState(false);

  const sortedRows = [...rows].sort((a, b) => {
    const aYear = safeToNumber(a?.year ?? a?.bsnsYear ?? a?.bsns_year, -Infinity);
    const bYear = safeToNumber(b?.year ?? b?.bsnsYear ?? b?.bsns_year, -Infinity);
    return aYear - bYear;
  }); // 수정 이유: 연도 순서를 고정해 KPI 추세가 뒤바뀌는 현상 방지

  /**
   * Process backend data to extract KPI values
   */
  const processedData = sortedRows.map((row) => {
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
   */
  const latestValues = {};
  INSIGHT_METRICS.forEach((metric) => {
    latestValues[metric.key] = getLatestValid(processedData, metric.key);
  });

  /**
   * Build time series data for charts
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
   */
  function MetricCard({ title, value, series, colorClass, footer, tooltip }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, triggerLeft: 0, isMobile: false, showBelow: false });
    const triggerRef = useRef(null);

    useEffect(() => {
      if (showTooltip && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const isMobile = viewportWidth <= 768;
        const spaceAbove = rect.top;
        const showBelow = spaceAbove < 150;

        setTooltipPosition({
          top: showBelow ? rect.bottom + 12 : rect.top - 12,
          left: rect.left + rect.width / 2,
          triggerLeft: rect.left + rect.width / 2,
          isMobile,
          showBelow,
        });
      }
    }, [showTooltip]);

    const getTooltipStyle = () => {
      const { top, left, isMobile, showBelow } = tooltipPosition;

      if (isMobile) {
        // 모바일: 화면 가운데 고정
        return {
          position: 'fixed',
          top: `${top}px`,
          left: '50%',
          transform: `translateX(-50%) ${showBelow ? 'translateY(0)' : 'translateY(-100%)'}`,
          maxWidth: 'calc(100vw - 32px)',
          width: '320px',
        };
      } else {
        // 데스크탑: ? 버튼 바로 위에 표시
        return {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: `translateX(-50%) ${showBelow ? 'translateY(0)' : 'translateY(-100%)'}`,
          maxWidth: '320px',
          width: 'auto',
          minWidth: '200px',
        };
      }
    };

    return (
      <div className="metric-card">
        <div className="metric-card-title">
          {title}
          {tooltip && (
            <>
              <span
                ref={triggerRef}
                className="metric-card-info"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
              >
                ?
              </span>
              {showTooltip && createPortal(
                <div
                  className={`metric-card-tooltip-portal ${tooltipPosition.isMobile ? 'mobile' : 'desktop'} ${tooltipPosition.showBelow ? 'below' : 'above'}`}
                  style={getTooltipStyle()}
                >
                  <div className="metric-card-tooltip-formula">{tooltip.formula}</div>
                  <div className="metric-card-tooltip-desc">{tooltip.description}</div>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
        <div className={`metric-card-value ${colorClass}`}>{value}</div>
        <div className="metric-card-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <Tooltip
                formatter={(value) => {
                  if (value === null || value === undefined) return ['N/A', ''];
                  const num = typeof value === 'number' && Number.isFinite(value) ? value : 0;
                  return [num.toLocaleString(), ''];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0] && payload[0].payload) {
                    return `${payload[0].payload.x}년`;
                  }
                  return '';
                }}
                contentStyle={{ fontSize: 12, padding: "4px 6px" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Line
                type="monotone"
                dataKey="y"
                dot={false}
                strokeWidth={2}
                connectNulls={false}
                stroke="#9ca3af"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {footer && <div className="metric-card-footer">{footer}</div>}
      </div>
    );
  }

  // Split metrics into financial and non-financial
  const financialMetrics = INSIGHT_METRICS.filter(m =>
    ['roe', 'debtRatio', 'currentRatio', 'operatingMargin', 'revenueGrowth', 'eps'].includes(m.key)
  );

  const nonFinancialMetrics = INSIGHT_METRICS.filter(m =>
    ['riskScore', 'governanceScore', 'dividendPerShare'].includes(m.key)
  );

  return (
    <section className="card-surface insight-cards">
      <div className="insight-cards-content">
        {/* Section Title */}
        <div className="metrics-section-header">
          <h2 className="metrics-section-title">상세 재무 지표</h2>
        </div>

        {/* Financial Metrics Grid (3x2) */}
        <div className="metrics-grid metrics-grid-financial">
          {financialMetrics.map((metric) => {
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
                tooltip={metric.tooltip}
              />
            );
          })}
        </div>

        {/* Divider */}
        <div className="metrics-divider"></div>

        {/* Non-Financial Metrics Grid (3x1) */}
        <div className="metrics-grid metrics-grid-nonfinancial">
          {nonFinancialMetrics.map((metric) => {
            const formatter = FORMATTERS[metric.format] || ((v) => v);
            const latestValue = latestValues[metric.key];
            const series = timeSeriesData[metric.key];
            const colorClass = resolveColor(latestValue, metric.color);

            // Define tooltips for non-financial metrics
            const tooltips = {
              riskScore: {
                formula: "100-(부도×40+회생×40+감사의견(한정/부적정)×20+거래정지/상장폐지×20+소송×2)",
                description: "openDART 리스크 이벤트(부도·회생·감사의견·거래정지·소송)를 연도별로 집계해 가중 감점 후 0-100점으로 환산합니다. DART 공시를 동기화할 때 DL_RISK_EVENTS에 저장된 원본 이벤트를 그대로 사용하며, 점수가 높을수록 최근 5년간 법적·재무 리스크가 적다는 뜻입니다."
              },
              governanceScore: {
                formula: "대주주 지분 안정성(4)+내부자/특수관계인 위반 없음(3)+직원 수 증가율(3)",
                description: "openDART 대주주·임원현황(hyslrSttus/exctvSttus)과 직원수 공시를 기반으로 지배구조 건전성을 0-10점으로 스코어링합니다. 대주주·특수관계인 집중도가 낮고 위반 이력이 없으며 인력 규모가 안정적으로 늘수록 높은 점수를 받으며, 계산 결과는 DL_GOVERNANCE_DATA에 저장된 값을 그대로 보여줍니다."
              },
              dividendPerShare: {
                formula: "DART 공시 기준 주당 현금배당금",
                description: "기업이 주주에게 지급하는 주당 배당금. DART(전자공시시스템)의 공식 배당 공시 데이터를 기반으로 표시. 배당이 없는 경우 N/A로 표시되며, 배당금이 높을수록 주주 환원 정책이 우수한 것으로 평가."
              }
            };

            return (
              <MetricCard
                key={metric.key}
                title={metric.title}
                value={safeFormat(formatter, latestValue)}
                series={series}
                colorClass={colorClass}
                tooltip={tooltips[metric.key]}
              />
            );
          })}
        </div>

        {/* Collapsible Explanation Section */}
        <div className="metrics-explanation-toggle">
          <button
            className="toggle-button"
            onClick={() => setShowExplanations(!showExplanations)}
            aria-expanded={showExplanations}
            aria-controls="metrics-explanation-content"
          >
            <span className="toggle-icon">📖</span>
            <span className="toggle-text">지표 설명 및 기준</span>
            <span className="toggle-arrow">{showExplanations ? "▲" : "▼"}</span>
          </button>

          {showExplanations && (
            <div id="metrics-explanation-content" className="metrics-explanation-content">
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
          )}
        </div>
      </div>
    </section>
  );
}
