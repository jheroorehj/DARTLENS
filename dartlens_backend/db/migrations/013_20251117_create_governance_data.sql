-- V2.0: DL_GOVERNANCE_DATA 테이블 생성
-- 기업의 대주주, 임원, 직원 현황 등 거버넌스 관련 데이터 저장

CREATE TABLE IF NOT EXISTS DL_GOVERNANCE_DATA (
  TBLKEY VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '테이블키 (UUID)',
  ADDDATE VARCHAR(17) DEFAULT NULL COMMENT '추가 일시 (동기화 시간)',
  MODIFYDATE VARCHAR(17) DEFAULT NULL COMMENT '수정 일시 (갱신 시간)',
  COMKEY VARCHAR(32) DEFAULT NULL COMMENT '회사키',
  corp_code VARCHAR(8) NOT NULL UNIQUE COMMENT '기업 코드 (기업당 1개 레코드)',
  bsns_year VARCHAR(4) NOT NULL COMMENT '기준연도 (yyyy)',
  major_shareholders VARCHAR(2000) DEFAULT NULL COMMENT '대주주 현황 (JSON 형식)',
  employee_count INT DEFAULT NULL COMMENT '직원 수 (명)',
  governance_score INT DEFAULT NULL COMMENT '거버넌스 점수 (0-100, 높을수록 우수)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='거버넌스 데이터';
