import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Cell
} from 'recharts';

export default function BubbleChart({
  data,
  xKey,
  yKey,
  zKey = null,
  xLabel,
  yLabel,
  title,
  xUnit = '%',
  yUnit = '%'
}) {
  // Filter valid data
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

  // Prepare bubble data
  const bubbleData = validData.map(d => {
    // Calculate bubble size (z value)
    let zValue = 100; // default size
    if (zKey && d[zKey] !== null && d[zKey] !== undefined) {
      // Normalize z value for bubble size (0-200 range)
      zValue = Math.max(50, Math.min(200, Math.abs(d[zKey]) * 10));
    }

    return {
      x: d[xKey],
      y: d[yKey],
      z: zValue,
      year: d.year,
      name: `${d.year}년`
    };
  });

  // Calculate color based on quadrant
  const getColor = (x, y) => {
    if (x >= 0 && y >= 10) return '#10b981'; // 우상단: 녹색 (이상적)
    if (x >= 0 && y < 10) return '#f59e0b'; // 우하단: 노란색 (성장 but 낮은 수익)
    if (x < 0 && y >= 10) return '#3b82f6'; // 좌상단: 파란색 (수익 but 마이너스 성장)
    return '#ef4444'; // 좌하단: 빨간색 (위험)
  };

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
              <span className="tooltip-value">{data.y?.toFixed(2)}{yUnit}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Generate insight based on latest position
  const getInsight = () => {
    if (bubbleData.length === 0) return '';

    const latest = bubbleData[bubbleData.length - 1];
    const x = latest.x;
    const y = latest.y;

    if (x >= 10 && y >= 15) {
      return `✅ 투자 추천 구간 (우상단): 매출 성장 ${x.toFixed(1)}%, 영업이익률 ${y.toFixed(1)}% - 고성장 고수익`;
    } else if (x >= 0 && y >= 10) {
      return `📈 긍정 구간: 성장률 ${x.toFixed(1)}%, 수익성 ${y.toFixed(1)}% 유지 중`;
    } else if (x >= 10 && y < 10) {
      return `⚠️ 주의 (우하단): 높은 성장(${x.toFixed(1)}%) 대비 낮은 수익성(${y.toFixed(1)}%) - 수익성 개선 확인 대기`;
    } else if (x < 0 && y >= 10) {
      return `📊 관망 (좌상단): 마이너스 성장(${x.toFixed(1)}%) / 수익성 ${y.toFixed(1)}% 유지 - 성장 회복 모니터링`;
    } else {
      return `🔴 비추천 (좌하단): 성장률 ${x.toFixed(1)}%, 수익성 ${y.toFixed(1)}% - 양 지표 개선 시까지 대기`;
    }
  };

  return (
    <div className="bubble-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-subtitle">
          우상단(녹색)으로 갈수록 이상적인 상태입니다
        </div>
      </div>

      <div className="chart-scroll-wrapper chart-aspect-16-9">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            unit={xUnit}
            hide={true}
          />

          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            unit={yUnit}
            hide={true}
          />

          <ZAxis type="number" dataKey="z" range={[100, 400]} />

          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Reference lines for quadrants */}
          <ReferenceLine
            x={0}
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <ReferenceLine
            y={10}
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 5"
          />

          {/* Bubble scatter */}
          <Scatter
            name="연도별 위치"
            data={bubbleData}
            fillOpacity={0.7}
          >
            {bubbleData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.x, entry.y)}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Scatter>

          {/* Year labels on bubbles */}
          {bubbleData.map((entry, index) => (
            <text
              key={`label-${index}`}
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize={12}
              fontWeight="600"
            >
              {entry.year}
            </text>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      </div>

      {/* Quadrant Legend */}
      <div className="bubble-legend">
        <div className="bubble-legend-item">
          <div className="bubble-legend-dot" style={{ backgroundColor: '#10b981' }}></div>
          <span>우상단: 이상적 (고성장 + 고수익)</span>
        </div>
        <div className="bubble-legend-item">
          <div className="bubble-legend-dot" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>좌상단: 안정적 (저성장 + 고수익)</span>
        </div>
        <div className="bubble-legend-item">
          <div className="bubble-legend-dot" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>우하단: 성장형 (고성장 + 저수익)</span>
        </div>
        <div className="bubble-legend-item">
          <div className="bubble-legend-dot" style={{ backgroundColor: '#ef4444' }}></div>
          <span>좌하단: 위험 (저성장 + 저수익)</span>
        </div>
      </div>

      <div className="chart-footer">
        <div className="chart-insight">
          {getInsight()}
        </div>
      </div>
    </div>
  );
}
