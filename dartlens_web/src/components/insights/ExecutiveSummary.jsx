import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { calculateInvestmentGrade, getCategoryInsight, getScoreBreakdown } from '../../utils/scoring';
import { getLatestValid } from './utils';
function deriveLatestFromHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) return null;

  const pickValue = (row, key) => {
    if (row?.[key] !== null && row?.[key] !== undefined) return row[key];
    if (row?.kpis?.[key] !== null && row?.kpis?.[key] !== undefined) return row.kpis[key];
    return null;
  };

  const keys = [
    'roe',
    'debtRatio',
    'currentRatio',
    'operatingMargin',
    'revenueGrowth',
    'eps',
    'riskScore',
    'governanceScore',
    'dividendPerShare'
  ];

  const latest = {};
  let hasValue = false;

  keys.forEach((key) => {
    const series = history.map((row) => ({ [key]: pickValue(row, key) }));
    const value = getLatestValid(series, key);
    if (value !== null && value !== undefined) {
      latest[key] = value;
      hasValue = true;
    }
  });

  return hasValue ? latest : null;
}

export default function ExecutiveSummary({ latestKpis, kpiHistory = [] }) {
  const effectiveHistory = Array.isArray(kpiHistory) ? kpiHistory : [];
  const resolvedLatest = latestKpis || deriveLatestFromHistory(effectiveHistory);

  if (!resolvedLatest) {
    return (
      <div className="executive-summary">
        <div className="executive-summary-empty">
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

  const grades = calculateInvestmentGrade(resolvedLatest, effectiveHistory);
  const breakdown = grades.breakdown || getScoreBreakdown(resolvedLatest, effectiveHistory);
  const tooltips = buildScoreTooltips(resolvedLatest, breakdown);
  const returnsBonus = buildDividendBonus(breakdown);

  return (
    <div className="executive-summary">
      <div className="executive-summary-header">
        <h2 className="executive-summary-title">투자 등급 분석</h2>
        <div className="executive-summary-overall">
          <span className="overall-grade">{grades.grade}</span>
          <span className="overall-stars">
            {'★'.repeat(grades.stars)}{'☆'.repeat(5 - grades.stars)}
          </span>
          <span className="overall-recommendation">{grades.recommendation}</span>
        </div>
      </div>

      <div className="executive-summary-scores">
        {/* Safety Score */}
        <ScoreCard
          title="안전성"
          subtitle="Safety"
          score={grades.safety}
          icon="✅️"
          insight={getCategoryInsight(grades.safety, 'safety')}
          color={getScoreColor(grades.safety)}
          tooltip={tooltips.safety}
        />

        {/* Growth Score */}
        <ScoreCard
          title="성장성"
          subtitle="Growth"
          score={grades.growth}
          icon="📈"
          insight={getCategoryInsight(grades.growth, 'growth')}
          color={getScoreColor(grades.growth)}
          tooltip={tooltips.growth}
        />

        {/* Returns Score */}
        <ScoreCard
          title="수익성"
          subtitle="Returns"
          score={grades.returns}
          icon="💰"
          insight={getCategoryInsight(grades.returns, 'returns')}
          color={getScoreColor(grades.returns)}
          tooltip={tooltips.returns}
          bonusLabel={returnsBonus?.label}
          bonusTooltip={returnsBonus?.tooltip}
        />
      </div>
    </div>
  );
}

/**
 * Individual Score Card
 */
function ScoreCard({ title, subtitle, score, icon, insight, color, tooltip, bonusLabel, bonusTooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const infoRef = useRef(null);

  useEffect(() => {
    if (showTooltip && infoRef.current) {
      const rect = infoRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showTooltip]);

  // Safe score handling
  const safeScore = typeof score === 'number' && Number.isFinite(score) ? score : 0;

  return (
    <div className={`score-card score-card-${color}`}>
      <div className="score-card-header">
        <span className="score-card-icon">{icon}</span>
        <div className="score-card-titles">
          <div className="score-card-title-row">
            <h3 className="score-card-title">{title}</h3>
            {tooltip && (
              <>
                <span
                  ref={infoRef}
                  className="metric-card-info score-card-info"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  ?
                </span>
                {showTooltip && createPortal(
                  <div
                    className="metric-card-tooltip-portal score-card-tooltip"
                    style={{
                      position: 'fixed',
                      top: `${tooltipPosition.top}px`,
                      left: `${tooltipPosition.left}px`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    <div className="metric-card-tooltip-formula">{tooltip.formula}</div>
                    <div className="metric-card-tooltip-desc">{tooltip.description}</div>
                  </div>,
                  document.body
                )}
              </>
            )}
          </div>
          <span className="score-card-subtitle">{subtitle}</span>
        </div>
      </div>

      <div className="score-card-value">
        <div className="score-main-value">
          <span className="score-number">{safeScore.toFixed(1)}</span>
          <span className="score-max">/10</span>
        </div>
        {bonusLabel && (
          <span className="score-bonus" title={bonusTooltip || ''}>{bonusLabel}</span>
        )}
      </div>

      <div className="score-card-bar">
        <div
          className="score-card-fill"
          style={{ width: `${(safeScore / 10) * 100}%` }}
        />
      </div>

      <p className="score-card-insight">{insight}</p>

      <div className="score-card-rating">
        {'★'.repeat(Math.round(score / 2))}{'☆'.repeat(5 - Math.round(score / 2))}
      </div>
    </div>
  );
}

function buildScoreTooltips(kpis = {}, breakdown) {
  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const formatNumber = (value, digits = 1) => safeNumber(value).toFixed(digits);

  const contribution = (value, weight) => formatNumber(safeNumber(value) * weight, 2);
  const returnsWeights = {
    roe: 0.4,
    epsGrowth: 0.35,
    epsLevel: 0.25
  };
  const trendValue = (node, fallback = null) => {
    const candidate = node?.value ?? node;
    const num = Number(candidate ?? fallback);
    return Number.isFinite(num) ? num : null;
  };
  const formatTrend = (node, suffix = '') => {
    const value = trendValue(node);
    return value === null ? 'N/A' : `${value.toFixed(2)}${suffix}`;
  };

  return {
    safety: {
      formula: `정규화 후 추세 보정 가중합 (레버리지 25% + 유동성 25% + 수익성 안정성 25% + 거버넌스/리스크 25%)`,
      description: `레버리지 ${contribution(breakdown?.safety?.parts?.leverageScore, 0.25)} + 유동성 ${contribution(breakdown?.safety?.parts?.liquidityScore, 0.25)} + 수익성 안정성 ${contribution(breakdown?.safety?.parts?.profitStabilityScore, 0.25)} + 거버넌스/리스크 ${contribution(breakdown?.safety?.parts?.governanceRiskScore, 0.25)} = ${formatNumber(breakdown?.safety?.score)}점`
    },
    growth: {
      formula: `Level 70% + Trend 30% (매출 트렌드 ${formatTrend(breakdown?.growth?.parts?.trend?.revenueGrowth, '%')}·OPM 트렌드 ${formatTrend(breakdown?.growth?.parts?.trend?.operatingMargin, '%')}) 정규화 후 가중합`,
      description: `Level ${formatNumber(breakdown?.growth?.parts?.growthLevel)}×0.7 + Trend ${formatNumber(breakdown?.growth?.parts?.growthTrend)}×0.3 = ${formatNumber(breakdown?.growth?.score)}점`
    },
    returns: {
      formula: `ROE ${formatTrend(breakdown?.returns?.parts?.trend?.roe, '%')} + EPS CAGR ${formatTrend(breakdown?.returns?.parts?.trend?.eps, '%')}·수준 정규화 후 변동성 패널티 ${formatNumber(breakdown?.returns?.parts?.epsPenalty)}점 차감${breakdown?.returns?.parts?.hasDividendData ? ' (배당 성장·안정성은 +@ 별도 표기)' : ''}`,
      description: `ROE 기여 ${contribution(breakdown?.returns?.parts?.roeNormalized, returnsWeights.roe)} + EPS 성장 기여 ${contribution(breakdown?.returns?.parts?.epsCagrScore, returnsWeights.epsGrowth)} + EPS 수준 기여 ${contribution(breakdown?.returns?.parts?.epsLevelScore, returnsWeights.epsLevel)} – 패널티 ${formatNumber(breakdown?.returns?.parts?.epsPenalty)} = ${formatNumber(breakdown?.returns?.score)}점${breakdown?.returns?.parts?.hasDividendData ? ' · 배당 성장/안정성은 +@로 별도 표기' : ''}`
    }
  };
}

function buildDividendBonus(breakdown) {
  const dividendParts = breakdown?.returns?.parts;
  if (!dividendParts?.hasDividendData) return null;

  const safeNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const formatNumber = (value, digits = 1) => {
    const num = safeNumber(value);
    return num === null ? 'N/A' : num.toFixed(digits);
  };

  return {
    label: '배당 +@',
    tooltip: `배당 +@ 참고 점수: 성장 ${formatNumber(dividendParts.dividendGrowthNormalized)} + 안정성 보너스 ${formatNumber(dividendParts.dividendStabilityBonus)} → ${formatNumber(dividendParts.dividendScore)}점 (총점 미반영)`
  };
}

/**
 * Get color class based on score
 */
function getScoreColor(score) {
  if (score >= 8) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 4) return 'warning';
  return 'poor';
}
