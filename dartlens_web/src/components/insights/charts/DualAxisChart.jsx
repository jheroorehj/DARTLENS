import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { safeToNumber, safeToFixed } from '../../../utils/numberUtils';

export default function DualAxisChart({
  data = [],
  leftKey,
  rightKey,
  leftLabel,
  rightLabel,
  title,
  subtitle = null,
  leftUnit = '%',
  rightUnit = '%',
  leftColor = '#3b82f6',
  rightColor = '#10b981',
  chartType = 'mixed' // 'mixed' (bar+line), 'lines' (both lines)
}) {
  const normalizedData = (data || []).map((d) => ({
    year: d?.year ?? '', // 수정 이유: 연도 누락 시에도 안정적으로 필터링하기 위함
    [leftKey]: safeToNumber(d?.[leftKey]), // 수정 이유: 입력값을 숫자로 일관 정규화하여 축 계산 오류 방지
    [rightKey]: safeToNumber(d?.[rightKey]) // 수정 이유: EPS/ROE 모두 숫자 스케일로 맞추기 위함
  }));

  // Filter valid data
  const validData = normalizedData.filter(
    (d) => d.year && (d[leftKey] !== null || d[rightKey] !== null)
  );

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
    [leftKey]: d[leftKey],
    [rightKey]: d[rightKey]
  }));

  const addDomainPadding = (values = []) => {
    const numeric = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!numeric.length) return ['auto', 'auto'];
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    const span = max - min || Math.abs(max) || 1;
    const padding = span * 0.1;
    return [min - padding, max + padding];
  }; // 수정 이유: ROE 선이 바닥에 붙는 문제를 해결하기 위해 자동 패딩 도메인 계산 추가

  const leftDomain = addDomainPadding(chartData.map((d) => d[leftKey]));
  const rightDomain = addDomainPadding(chartData.map((d) => d[rightKey]));

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
                <span className="tooltip-value">
                  {entry.value !== null && entry.value !== undefined
                    ? `${safeToFixed(entry.value, 2)}${entry.unit}`
                    : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dual-axis-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {subtitle && (
          <div className="chart-subtitle">{subtitle}</div>
        )}
      </div>

      <div className="chart-scroll-wrapper chart-aspect-16-9">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 0, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="year"
            hide={true}
            axisLine={false} // x축 선을 숨겨 시각적 노출 차단
            tickLine={false} // x축 눈금 선 숨김 처리
            tick={{ fill: 'transparent' }} // x축 눈금 텍스트를 투명하게 설정
            label={{ value: '', position: 'insideBottom', fill: 'transparent' }} // x축 레이블을 투명 처리로 비가시화
          />

          {/* Left Y-Axis */}
          {/* 수정 이유: ROE(%) 전용 축을 노출해 EPS와 단위 혼선을 제거 */}
          <YAxis
            yAxisId="left"
            domain={leftDomain}
            padding={{ top: 12, bottom: 12 }}
            tickFormatter={(v) => `${safeToFixed(v, 1)}${leftUnit}`}
            axisLine={false} // 좌측 y축 선을 감춰 시각적 노출 제거
            tickLine={false} // 좌측 y축 눈금 선 비표시 처리
            tick={{ fill: 'transparent' }} // 좌측 y축 눈금 텍스트를 투명화
            label={{ value: `${leftLabel} (${leftUnit})`, angle: -90, position: 'insideLeft', fill: 'transparent' }} // 좌측 y축 레이블을 투명 처리
          />

          {/* Right Y-Axis */}
          {/* 수정 이유: EPS(원) 전용 축으로 분리해 수익성 라인 왜곡 방지 */}
          <YAxis
            yAxisId="right"
            domain={rightDomain}
            padding={{ top: 12, bottom: 12 }}
            orientation="right"
            tickFormatter={(v) =>
              rightUnit === '원' ? `${Math.round(v).toLocaleString()}${rightUnit}` : `${safeToFixed(v, 1)}${rightUnit}`
            }
            axisLine={false} // 우측 y축 선을 숨겨 축 가시성을 제거
            tickLine={false} // 우측 y축 눈금 선 비노출 처리
            tick={{ fill: 'transparent' }} // 우측 y축 눈금 텍스트 투명화
            label={{ value: `${rightLabel} (${rightUnit})`, angle: 90, position: 'insideRight', fill: 'transparent' }} // 우측 y축 레이블 투명 처리
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            verticalAlign="top"
            height={36}
            iconType="square"
          />

          {/* Reference line at 0 for growth rate */}
          <ReferenceLine
            y={0}
            yAxisId="left"
            stroke="#9ca3af"
            strokeDasharray="3 3"
          />

          {/* Left Metric - Bar or Line based on chartType */}
          {chartType === 'mixed' ? (
            <Bar
              yAxisId="left"
              dataKey={leftKey}
              name={`${leftLabel} (${leftUnit})`}
              fill={leftColor}
              fillOpacity={0.8}
              unit={leftUnit}
              radius={[4, 4, 0, 0]}
            />
          ) : (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={leftKey}
              name={`${leftLabel} (${leftUnit})`}
              stroke={leftColor}
              strokeWidth={3}
              dot={{ r: 6, fill: leftColor, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8 }}
              unit={leftUnit}
              connectNulls={false}
            />
          )}

          {/* Right Metric - Always Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={rightKey}
            name={`${rightLabel} (${rightUnit})`}
            stroke={rightColor}
            strokeWidth={3}
            dot={{ r: 6, fill: rightColor, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8 }}
            unit={rightUnit}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <div className="chart-insight">
          {generateInsight(chartData, leftKey, rightKey, leftLabel, rightLabel)}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate insight based on trends
 */
function generateInsight(data, leftKey, rightKey, leftLabel, rightLabel) {
  if (data.length < 2) return '';

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];

  const leftValue = safeToNumber(latest[leftKey]);
  const rightValue = safeToNumber(latest[rightKey]);

  // Null check
  if (leftValue === null || rightValue === null) {
    return '📊 데이터 부족: 최신 연도 정보 확인 불가';
  }

  const prevLeft = safeToNumber(previous[leftKey]);
  const prevRight = safeToNumber(previous[rightKey]);

  function getTrend(current, prev, absThreshold = 1) {
    if (prev === null) return '횡보';
    const diff = current - prev;
    if (Math.abs(diff) <= absThreshold) return '횡보';
    return diff > 0 ? '증가' : '감소';
  }

  const leftTrend = getTrend(leftValue, prevLeft, 1); // ROE 절댓값 1% 기준
  const rightTrend = getTrend(rightValue, prevRight, 1); // EPS는 절댓값 기준 적용 가능

  // ROE vs EPS 패턴
  if (leftKey === 'roe' && rightKey === 'eps') {
    if (leftValue > 10 && rightValue > 2000) {
      return `✅ 투자 추천 구간: ROE ${leftValue.toFixed(1)}%, EPS ${Math.round(rightValue).toLocaleString()}원으로 우수한 수익성 유지`;
    } else if (leftTrend === '증가' && rightTrend === '증가') {
      return `📈 긍정 신호: ROE와 EPS 모두 상승 추세 (전년 대비 개선)`;
    } else if (leftTrend === '감소' && rightTrend === '감소') {
      return `⚠️ 주의: ROE와 EPS 동반 하락 중 (회복 시까지 관망 권장)`;
    } else if (leftTrend === '횡보' || rightTrend === '횡보') {
      return `⏸️ 관망: ROE 또는 EPS 횡보 구간 (추세 불분명, 추가 모니터링 필요)`;
    } else {
      return `📊 혼조세: ROE ${leftTrend}, EPS ${rightTrend} (추가 모니터링 필요)`;
    }
  }


  // Revenue Growth vs Operating Margin 패턴
  if (leftValue > 10 && rightValue > 10) {
    return `✅ 투자 추천 구간: 매출 성장률 ${leftValue.toFixed(1)}%, 영업이익률 ${rightValue.toFixed(1)}%로 양호한 균형`;
  } else if (leftValue > 10 && rightValue < 10) {
    return `⚠️ 주의: 높은 성장률(${leftValue.toFixed(1)}%) 대비 낮은 수익성(${rightValue.toFixed(1)}%) - 수익성 회복 시까지 관망`;
  } else if (leftValue < 0 && rightValue > 10) {
    return `📊 관망: 마이너스 성장률(${leftValue.toFixed(1)}%) / 영업이익률 ${rightValue.toFixed(1)}% 유지 중`;
  } else if (leftValue < 0 && rightValue < 10) {
    return `🔴 비추천: 성장률 ${leftValue.toFixed(1)}%, 수익성 ${rightValue.toFixed(1)}% - 개선 확인 시까지 대기`;
  } else {
    return `📊 중립: 매출 성장률 ${leftValue.toFixed(1)}%, 영업이익률 ${rightValue.toFixed(1)}% (지표 개선 여부 모니터링)`;
  }
}
