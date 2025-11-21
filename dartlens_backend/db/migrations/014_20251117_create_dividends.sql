-- V2.0: DL_DIVIDENDS 테이블 생성
-- 기업의 배당금, 배당성향 등 배당 관련 데이터 저장 (5년 이력)

CREATE TABLE IF NOT EXISTS DL_DIVIDENDS (
  TBLKEY VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '테이블키 (UUID)',
  ADDDATE VARCHAR(17) DEFAULT NULL COMMENT '추가 일시 (동기화 시간)',
  MODIFYDATE VARCHAR(17) DEFAULT NULL COMMENT '수정 일시 (갱신 시간)',
  COMKEY VARCHAR(32) DEFAULT NULL COMMENT '회사키',
  corp_code VARCHAR(8) NOT NULL COMMENT '기업 코드',
  bsns_year VARCHAR(4) NOT NULL COMMENT '배당 기준연도 (yyyy)',
  dps BIGINT DEFAULT NULL COMMENT '주당배당금 (원)',
  dividend_yield DECIMAL(5,2) DEFAULT NULL COMMENT '배당수익률 (%, 상장사만 계산 가능)',
  payout_ratio DECIMAL(5,2) DEFAULT NULL COMMENT '배당성향 (%)',
  UNIQUE KEY UX_DL_DIVIDENDS_unique (corp_code, bsns_year),
  INDEX idx_DL_DIVIDENDS_corp (corp_code, bsns_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배당 데이터';
