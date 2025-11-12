export const INSIGHT_METRICS = [
  {
    key: "revenue",
    title: "매출액",
    format: "eok",
    color: { type: "static", value: "text-gray-900" },
    explanation: {
      heading: "매출액: 기업 규모와 성장성",
    },
  },
  {
    key: "op_margin",
    title: "영업이익률",
    format: "pct",
    color: { type: "opm" },
    explanation: {
      heading: "영업이익률: 본업 수익성",
      ranges: [
        { text: "10% 이상", className: "text-green-600" },
        { text: " 5~10%", className: "text-yellow-600" },
        { text: " 5% 미만", className: "text-red-600" },
      ],
    },
  },
  {
    key: "ni_margin",
    title: "순이익률",
    format: "pct",
    color: { type: "nim" },
    explanation: {
      heading: "순이익률: 전체 경영 효율",
      ranges: [
        { text: "8% 이상", className: "text-green-600" },
        { text: " 3~8%", className: "text-yellow-600" },
        { text: " 3% 미만", className: "text-red-600" },
      ],
    },
  },
  {
    key: "debt_ratio",
    title: "부채비율",
    format: "pct",
    color: { type: "debt" },
    explanation: {
      heading: "부채비율: 재무 건전성",
      ranges: [
        { text: "100% 이하", className: "text-blue-600" },
        { text: " 100~200%", className: "text-green-600" },
        { text: " 200~300%", className: "text-yellow-600" },
        { text: " 300% 이상", className: "text-red-600" },
      ],
    },
  },
  {
    key: "retained_ratio",
    title: "유보율",
    format: "pct",
    color: { type: "retained", thresholds: [200, 100] },
    explanation: {
      heading: "유보율: 내부 자본 축적력",
      ranges: [
        { text: "200% 이상", className: "text-green-600" },
        { text: " 100~200%", className: "text-yellow-600" },
        { text: " 100% 미만", className: "text-red-600" },
      ],
    },
  },
];
