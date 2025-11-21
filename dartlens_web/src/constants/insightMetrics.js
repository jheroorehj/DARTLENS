export const INSIGHT_METRICS = [
  // ========== Financial KPIs (6개) ==========
  {
    key: "roe",
    title: "ROE (자기자본이익률)",
    format: "pct",
    color: { type: "roe" },
    explanation: {
      heading: "ROE: 자본 대비 수익성",
      description: "자기자본이익률 = (당기순이익 / 자본총계) × 100. 투자한 자본으로 얼마나 효율적으로 이익을 창출하는지 보여줍니다.",
      ranges: [
        { text: "10% 이상", className: "excellent" },
        { text: "5~10%", className: "good" },
        { text: "0~5%", className: "warning" },
        { text: "0% 미만", className: "poor" },
      ],
    },
  },
  {
    key: "debtRatio",
    title: "부채비율",
    format: "pct",
    color: { type: "debt" },
    explanation: {
      heading: "부채비율: 재무 건전성",
      description: "부채비율 = (부채총계 / 자본총계) × 100. 낮을수록 재무 안정성이 높습니다.",
      ranges: [
        { text: "100% 이하", className: "excellent" },
        { text: "100~200%", className: "good" },
        { text: "200~300%", className: "warning" },
        { text: "300% 이상", className: "poor" },
      ],
    },
  },
  {
    key: "currentRatio",
    title: "유동비율",
    format: "pct",
    color: { type: "current" },
    explanation: {
      heading: "유동비율: 단기 지급능력",
      description: "유동비율 = (유동자산 / 유동부채) × 100. 단기 채무 상환 능력을 나타냅니다.",
      ranges: [
        { text: "200% 이상", className: "excellent" },
        { text: "150~200%", className: "good" },
        { text: "100~150%", className: "warning" },
        { text: "100% 미만", className: "poor" },
      ],
    },
  },
  {
    key: "operatingMargin",
    title: "영업이익률",
    format: "pct",
    color: { type: "opm" },
    explanation: {
      heading: "영업이익률: 본업 수익성",
      description: "영업이익률 = (영업이익 / 매출액) × 100. 본업에서 얼마나 효율적으로 이익을 창출하는지 보여줍니다.",
      ranges: [
        { text: "10% 이상", className: "excellent" },
        { text: "5~10%", className: "good" },
        { text: "0~5%", className: "warning" },
        { text: "0% 미만", className: "poor" },
      ],
    },
  },
  {
    key: "revenueGrowth",
    title: "매출성장률 (YoY)",
    format: "pct",
    color: { type: "growth" },
    explanation: {
      heading: "매출성장률: 성장성 지표",
      description: "매출성장률 = ((당해 매출 - 전년 매출) / 전년 매출) × 100. 기업의 성장세를 보여줍니다.",
      ranges: [
        { text: "20% 이상", className: "excellent" },
        { text: "10~20%", className: "good" },
        { text: "0~10%", className: "warning" },
        { text: "0% 미만", className: "poor" },
      ],
    },
  },
  {
    key: "eps",
    title: "EPS (주당순이익)",
    format: "won",
    color: { type: "static", value: "metric-neutral" },
    explanation: {
      heading: "EPS: 주당 수익",
      description: "주당순이익 = 당기순이익 / 발행주식수. 투자자가 주식 1주당 얻는 이익을 나타냅니다.",
      ranges: [
        { text: "높을수록 우수", className: "excellent" },
        { text: "업종별 비교 권장", className: "neutral" },
      ],
    },
  },

  // ========== Non-Financial Metrics (3개) ==========
  {
    key: "riskScore",
    title: "리스크 점수",
    format: "num",
    color: { type: "risk" },
    explanation: {
      heading: "리스크 점수: 기업 안전성",
      description: "100 - (부도×40 + 회생×40 + 감사×20 + 정지×20 + 소송×2). 부도, 소송, 감사의견 등을 종합한 리스크 평가 점수입니다.",
      ranges: [
        { text: "80~100점", className: "excellent" },
        { text: "60~79점", className: "good" },
        { text: "40~59점", className: "warning" },
        { text: "0~39점", className: "poor" },
      ],
    },
  },
  {
    key: "governanceScore",
    title: "거버넌스 점수",
    format: "num",
    color: { type: "governance" },
    explanation: {
      heading: "거버넌스 점수: 경영 안정성",
      description: "대주주 안정성(4) + 내부자거래(3) + 직원증가(3). 기업의 경영 건전성과 지배구조를 평가합니다.",
      ranges: [
        { text: "8~10점", className: "excellent" },
        { text: "6~8점", className: "good" },
        { text: "4~6점", className: "warning" },
        { text: "0~4점", className: "poor" },
      ],
    },
  },
  {
    key: "dividendPerShare",
    title: "주당배당금 (DPS)",
    format: "won",
    color: { type: "static", value: "metric-neutral" },
    explanation: {
      heading: "주당배당금: 배당 수익",
      description: "DART API에서 직접 조회한 주당 배당금. 주주에게 지급하는 배당 수익을 나타냅니다.",
      ranges: [
        { text: "높을수록 우수", className: "excellent" },
        { text: "배당 없음: N/A", className: "neutral" },
      ],
    },
  },
];