import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { calculateCorrelation, linearRegression, getCorrelationStrength } from '../../../utils/correlation';

export default function ScatterCorrelationChart({
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
  title,
  xUnit = '%',
  yUnit = '원'
}) {
  // Filter valid data points
  const validData = data.filter(
    d => d[xKey] !== null && d[yKey] !== null && d[xKey] !== undefined && d[yKey] !== undefined
  );

  if (validData.length === 0) {
    return (
      <div className="chart-empty">
        <p>표시할 데이터가 없습니다.</p>
      </div>
    );
  }

  // Calculate correlation
  const xValues = validData.map(d => d[xKey]);
  const yValues = validData.map(d => d[yKey]);
  const correlation = calculateCorrelation(xValues, yValues);
  const correlationInfo = getCorrelationStrength(correlation);

  // Calculate regression line
  const regression = linearRegression(validData, xKey, yKey);

  // Prepare scatter data with year labels
  const scatterData = validData.map(d => ({
    x: d[xKey],
    y: d[yKey],
    year: d.year,
    name: `${d.year}년`
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">{data.name}</div>
          <div className="tooltip-content">
            <div className="tooltip-row">
              <span className="tooltip-label">{xLabel}:</span>
              <span className="tooltip-value">{data.x?.toFixed(2)}{xUnit}</span>
            </div>
            <div className="tooltip-row">
              <span className="tooltip-label">{yLabel}:</span>
              <span className="tooltip-value">{data.y?.toLocaleString()}{yUnit}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="correlation-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-stats">
          <span className="stat-badge stat-correlation">
            상관계수: {correlationInfo.value}
          </span>
          <span className="stat-badge stat-description">
            {correlationInfo.description}
          </span>
          {regression.r2 > 0 && (
            <span className="stat-badge stat-r2">
              R² = {regression.r2.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            unit={xUnit}
            hide={true}
            axisLine={false} // x축 선을 숨겨 시각적 노출 제거
            tickLine={false} // x축 눈금 선 비노출 처리
            tick={{ fill: 'transparent' }} // x축 눈금 텍스트 투명화
            label={{ value: '', position: 'insideBottom', fill: 'transparent' }} // x축 레이블을 투명 처리
          />

          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            unit={yUnit}
            hide={true}
            axisLine={false} // y축 선을 숨겨 화면 노출 차단
            tickLine={false} // y축 눈금 선 비표시 처리
            tick={{ fill: 'transparent' }} // y축 눈금 텍스트 투명화
            label={{ value: '', position: 'insideLeft', fill: 'transparent' }} // y축 레이블을 투명하게 숨김
          />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Trend line */}
          {regression.line.length > 0 && regression.r2 > 0.1 && (
            <ReferenceLine
              segment={regression.line}
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              ifOverflow="extendDomain"
            />
          )}

          {/* Scatter points with year labels */}
          <Scatter
            name="연도별 데이터"
            data={scatterData}
            fill="#10b981"
            fillOpacity={0.6}
            stroke="#059669"
            strokeWidth={2}
          >
            {scatterData.map((entry, index) => (
              <text
                key={`label-${index}`}
                x={0}
                y={0}
                dx={10}
                dy={-10}
                fill="#374151"
                fontSize={11}
                fontWeight="500"
              >
                {entry.year}
              </text>
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="chart-footer">
        <div className="chart-insight">
          {getInsightText(correlation, xLabel, yLabel)}
        </div>
        {regression.r2 > 0.1 && (
          <div className="chart-equation">
            추세선: {regression.equation}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate insight text based on correlation
 */
function getInsightText(correlation, xLabel, yLabel) {
  const abs = Math.abs(correlation);

  if (abs >= 0.7) {
    if (correlation > 0) {
      return `📈 ${xLabel}가 증가하면 ${yLabel}도 함께 증가하는 강한 양의 상관관계를 보입니다.`;
    } else {
      return `📉 ${xLabel}가 증가하면 ${yLabel}는 감소하는 강한 음의 상관관계를 보입니다.`;
    }
  } else if (abs >= 0.4) {
    if (correlation > 0) {
      return `📊 ${xLabel}와 ${yLabel} 사이에 중간 정도의 양의 상관관계가 있습니다.`;
    } else {
      return `📊 ${xLabel}와 ${yLabel} 사이에 중간 정도의 음의 상관관계가 있습니다.`;
    }
  } else {
    return `💡 ${xLabel}와 ${yLabel} 사이에 뚜렷한 상관관계가 관찰되지 않습니다. 다른 요인이 영향을 미칠 수 있습니다.`;
  }
}
