// src/components/insights/utils.js
export const fmtEok = (v) =>
  v == null ? "데이터 없음" : (v / 1e8).toFixed(2) + "억";

export const fmtPct = (v) =>
  v == null ? "데이터 없음" : v.toFixed(1) + "%";
