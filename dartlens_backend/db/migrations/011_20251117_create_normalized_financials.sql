-- V2.0: DL_NORMALIZED_FINANCIALS 테이블 생성
-- 3-Tier 정규화 프로세스를 거쳐 표준화된 18개 핵심 계정과목 저장

CREATE TABLE IF NOT EXISTS DL_NORMALIZED_FINANCIALS (
  TBLKEY VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '테이블키 (UUID)',
  ADDDATE VARCHAR(17) DEFAULT NULL COMMENT '추가 일시',
  MODIFYDATE VARCHAR(17) DEFAULT NULL COMMENT '수정 일시',
  COMKEY VARCHAR(32) DEFAULT NULL COMMENT '회사키',
  corp_code VARCHAR(8) NOT NULL COMMENT '기업 코드',
  bsns_year VARCHAR(4) NOT NULL COMMENT '사업연도 (yyyy)',
  reprt_code VARCHAR(5) NOT NULL COMMENT '보고서 코드 (11011~11014)',
  fs_div VARCHAR(3) NOT NULL COMMENT '재무제표 구분 (CFS/OFS)',
  revenue BIGINT DEFAULT NULL COMMENT '매출액 (원)',
  operating_profit BIGINT DEFAULT NULL COMMENT '영업이익 (원)',
  net_income BIGINT DEFAULT NULL COMMENT '당기순이익 (원)',
  total_assets BIGINT DEFAULT NULL COMMENT '자산총계 (원)',
  total_liabilities BIGINT DEFAULT NULL COMMENT '부채총계 (원)',
  total_equity BIGINT DEFAULT NULL COMMENT '자본총계 (원)',
  current_assets BIGINT DEFAULT NULL COMMENT '유동자산 (원)',
  current_liabilities BIGINT DEFAULT NULL COMMENT '유동부채 (원)',
  non_current_assets BIGINT DEFAULT NULL COMMENT '비유동자산 (원)',
  non_current_liabilities BIGINT DEFAULT NULL COMMENT '비유동부채 (원)',
  inventory BIGINT DEFAULT NULL COMMENT '재고자산 (원)',
  accounts_receivable BIGINT DEFAULT NULL COMMENT '매출채권 (원)',
  accounts_payable BIGINT DEFAULT NULL COMMENT '매입채무 (원)',
  cash BIGINT DEFAULT NULL COMMENT '현금및현금성자산 (원)',
  operating_cash_flow BIGINT DEFAULT NULL COMMENT '영업활동현금흐름 (원)',
  investing_cash_flow BIGINT DEFAULT NULL COMMENT '투자활동현금흐름 (원)',
  financing_cash_flow BIGINT DEFAULT NULL COMMENT '재무활동현금흐름 (원)',
  depreciation BIGINT DEFAULT NULL COMMENT '감가상각비 (원)',
  issued_shares BIGINT DEFAULT NULL COMMENT '발행주식수 (주)',
  UNIQUE KEY UX_DL_NORMALIZED_unique (corp_code, bsns_year, reprt_code, fs_div),
  INDEX idx_DL_NORMALIZED_corp (corp_code, bsns_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='정규화 재무제표';
