import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { safeToNumber, safeToFixed } from '../../../utils/numberUtils';

export default function GroupedBarChart({
  data = [],
  leftKey,
  rightKey,
  leftLabel,
  rightLabel,
  title,
  unit = '%',
  leftUnit,
  rightUnit,
  leftColor = '#3b82f6',
  rightColor = '#10b981'
}) {
  // Filter valid data
  const validData = data.filter(d => {
    if (!d.year) return false;
    const leftValue = safeToNumber(d[leftKey]);
    const rightValue = safeToNumber(d[rightKey]);
    return leftValue !== null || rightValue !== null;
  });

  if (validData.length === 0) {
    return (
      <div className="chart-empty">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = validData.map(d => ({
    year: d.year,
    [leftKey]: safeToNumber(d[leftKey]),
    [rightKey]: safeToNumber(d[rightKey])
  }));

  const effectiveLeftUnit = leftUnit ?? unit;
  const effectiveRightUnit = rightUnit ?? unit;

  const formatValue = (dataKey, value) => {
    const numericValue = safeToNumber(value);
    if (numericValue === null) return 'N/A';

    const suffix = dataKey === leftKey ? effectiveLeftUnit : effectiveRightUnit;

    if (suffix === '원') {
      return `${Math.round(numericValue).toLocaleString()}${suffix}`;
    }

    return `${safeToFixed(numericValue, 2)}${suffix}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">{label}년</div>
          <div className="tooltip-content">
            {payload.map((entry, index) => (
              <div key={index} className="tooltip-row">
                <span className="tooltip-label" style={{ color: entry.color }}>
                  {entry.name}:
                </span>
                <span className="tooltip-value">{formatValue(entry.dataKey, entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Generate insight based on latest data
  const getInsight = () => {
    if (chartData.length === 0) return '';

    const latest = chartData[chartData.length - 1];
    const leftValue = safeToNumber(latest[leftKey]);
    const rightValue = safeToNumber(latest[rightKey]);

    if (leftValue === null || rightValue === null) {
      return '📊 데이터 부족: 최신 연도 정보 확인 불가';
    }

    // ROE/EPS 생 데이터 비교 로직
    if (leftKey === 'roe' && rightKey === 'eps') {
      if (leftValue === null || rightValue === null) {
        return '📊 데이터 부족: 최신 연도 ROE/EPS 확인 필요';
      }

      if (leftValue >= 15 && rightValue >= 5000) {
        return `✅ 투자 추천: ROE ${leftValue.toFixed(1)}% · EPS ${Math.round(rightValue).toLocaleString()}원 모두 견조`;
      }

      if (leftValue < 0 && rightValue < 0) {
        return `🔴 비추천: ROE/EPS 모두 적자 구간 (${leftValue.toFixed(1)}%, ${Math.round(rightValue).toLocaleString()}원)`;
      }

      if (leftValue >= 10 && rightValue >= 2000) {
        return `📈 우상향 가능성: ROE ${leftValue.toFixed(1)}%, EPS ${Math.round(rightValue).toLocaleString()}원으로 양호`;
      }

      if (leftValue < 5 && rightValue < 1000) {
        return `⚠️ 주의: ROE ${leftValue.toFixed(1)}%, EPS ${Math.round(rightValue).toLocaleString()}원으로 낮은 수익성`;
      }

      if (leftValue > 10 && rightValue < 1000) {
        return `📊 ROE 우위: ROE ${leftValue.toFixed(1)}% 대비 EPS 회복 필요 (${Math.round(rightValue).toLocaleString()}원)`;
      }

      if (rightValue > 4000 && leftValue < 8) {
        return `📊 EPS 우위: EPS ${Math.round(rightValue).toLocaleString()}원 대비 ROE 개선 필요 (${leftValue.toFixed(1)}%)`;
      }

      return `📈 추세 확인: ROE ${leftValue.toFixed(1)}%, EPS ${Math.round(rightValue).toLocaleString()}원`;
    }

    // 일반 % 데이터인 경우 (매출성장률 vs 영업이익률)
    if (leftValue > 10 && rightValue > 15) {
      return `✅ 투자 추천 구간: ${leftLabel} ${leftValue.toFixed(1)}%, ${rightLabel} ${rightValue.toFixed(1)}%로 우수`;
    } else if (leftValue > 10 && rightValue < 10) {
      return `⚠️ 주의: 높은 ${leftLabel}(${leftValue.toFixed(1)}%) 대비 낮은 ${rightLabel}(${rightValue.toFixed(1)}%) - 수익성 회복 대기`;
    } else if (leftValue < 0 && rightValue > 10) {
      return `📊 관망: ${leftLabel} 마이너스(${leftValue.toFixed(1)}%) / ${rightLabel} ${rightValue.toFixed(1)}% 유지`;
    } else if (leftValue < 0 && rightValue < 10) {
      return `🔴 비추천: 양 지표 모두 저조 (${leftLabel} ${leftValue.toFixed(1)}%, ${rightLabel} ${rightValue.toFixed(1)}%) - 개선 시까지 대기`;
    } else if (Math.abs(leftValue - rightValue) < 3) {
      return `📊 균형: ${leftLabel}와 ${rightLabel} 유사한 수준 (${leftValue.toFixed(1)}% vs ${rightValue.toFixed(1)}%)`;
    } else if (leftValue > rightValue) {
      return `📈 ${leftLabel} 우세: ${leftValue.toFixed(1)}% > ${rightLabel} ${rightValue.toFixed(1)}%`;
    } else {
      return `📈 ${rightLabel} 우세: ${rightValue.toFixed(1)}% > ${leftLabel} ${leftValue.toFixed(1)}%`;
    }
  };

  return (
    <div className="grouped-bar-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-subtitle">
          연도별 지표를 나란히 비교하여 추세를 파악하세요
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="year"
            hide={true}
            axisLine={false} // x축 선을 숨겨 시각적 노출 방지
            tickLine={false} // x축 눈금 선을 비표시 처리
            tick={{ fill: 'transparent' }} // x축 눈금 텍스트를 투명화
            label={{ value: '', position: 'insideBottom', fill: 'transparent' }} // x축 레이블을 투명 처리해 숨김
          />

          <YAxis
            hide={true}
            axisLine={false} // y축 선을 숨겨 화면 노출 차단
            tickLine={false} // y축 눈금 선 비표시 처리
            tick={{ fill: 'transparent' }} // y축 눈금 텍스트 투명화
            label={{ value: '', position: 'insideLeft', fill: 'transparent' }} // y축 레이블을 투명하게 숨김
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            height={36}
            iconType="square"
          />

          {/* Reference line at 0 for negative values */}
          <ReferenceLine
            y={0}
            stroke="#9ca3af"
            strokeDasharray="3 3"
          />

          {/* First metric bar */}
          <Bar
            dataKey={leftKey}
            name={leftLabel}
            fill={leftColor}
            fillOpacity={0.8}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />

          {/* Second metric bar */}
          <Bar
            dataKey={rightKey}
            name={rightLabel}
            fill={rightColor}
            fillOpacity={0.8}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="chart-insight">
          {getInsight()}
        </div>
      </div>
    </div>
  );
}
