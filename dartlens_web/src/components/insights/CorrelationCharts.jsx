import ScatterCorrelationChart from './charts/ScatterCorrelationChart';
import DualAxisChart from './charts/DualAxisChart';
import BubbleChart from './charts/BubbleChart';
import { safeToNumber } from '../../utils/numberUtils';

export default function CorrelationCharts({ rows = [] }) {
  const sortedRows = [...rows].sort((a, b) => {
    const aYear = safeToNumber(a?.year ?? a?.bsnsYear ?? a?.bsns_year, -Infinity);
    const bYear = safeToNumber(b?.year ?? b?.bsnsYear ?? b?.bsns_year, -Infinity);
    return aYear - bYear;
  }); // 수정 이유: 연도 순 정렬 누락 시 시계열 상관 분석이 왜곡되는 문제 방지

  // Process backend data to extract KPI values
  const processedData = sortedRows.map((row) => {
    const kpis = row?.kpis || row || {}; // Fallback for legacy structure

    return {
      year: row?.year ?? row?.bsnsYear ?? row?.bsns_year ?? '',
      roe: safeToNumber(kpis.roe),
      eps: safeToNumber(kpis.eps),
      revenueGrowth: safeToNumber(kpis.revenueGrowth),
      operatingMargin: safeToNumber(kpis.operatingMargin),
    };
  });

  // Filter out years with insufficient data
  const validData = processedData.filter(
    (d) => d.year && (d.roe !== null || d.eps !== null || d.revenueGrowth !== null || d.operatingMargin !== null)
  );

  if (validData.length === 0) {
    return (
      <section className="card-surface">
        <div className="chart-empty">
          <p>상관관계 분석을 위한 데이터가 부족합니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card-surface">
      <div className="insight-cards-content">
        {/* ROE vs EPS - Dual Axis Chart for different units */}
        {/* 수정 이유: EPS(원) 규모에 ROE(%)가 묻히는 문제를 해결하기 위해 듀얼축 차트로 전환 */}
        <DualAxisChart
          data={validData}
          leftKey="roe"
          rightKey="eps"
          leftLabel="ROE"
          rightLabel="EPS"
          title="수익성 추세: ROE vs EPS"
          subtitle="단위 분리: 좌측 ROE(%), 우측 EPS(원)"
          leftUnit="%"
          rightUnit="원"
          leftColor="#3b82f6"
          rightColor="#94a3b8"
          chartType="lines"
        />

        {/* Revenue Growth vs Operating Margin - Dual Axis Chart */}
        <DualAxisChart
          data={validData}
          leftKey="revenueGrowth"
          rightKey="operatingMargin"
          leftLabel="매출성장률"
          rightLabel="영업이익률"
          title="성장성 vs 수익성 균형 분석"
          leftUnit="%"
          rightUnit="%"
          leftColor="#3b82f6"
          rightColor="#64748b"
          chartType="mixed"
        />
      </div>
    </section>
  );
}
