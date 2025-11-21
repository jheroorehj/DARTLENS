-- V2.0: DL_RISK_EVENTS 테이블 생성
-- 기업의 부도, 소송, 감사의견, 거래정지 등 리스크 이벤트 저장 (5년 이력)

CREATE TABLE IF NOT EXISTS DL_RISK_EVENTS (
  TBLKEY VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '테이블키 (UUID)',
  ADDDATE VARCHAR(17) DEFAULT NULL COMMENT '추가 일시 (동기화 시간)',
  MODIFYDATE VARCHAR(17) DEFAULT NULL COMMENT '수정 일시',
  COMKEY VARCHAR(32) DEFAULT NULL COMMENT '회사키',
  corp_code VARCHAR(8) NOT NULL COMMENT '기업 코드',
  event_type VARCHAR(30) NOT NULL COMMENT '이벤트 유형 (BANKRUPTCY, REHABILITATION, AUDIT, SUSPENSION, LITIGATION)',
  event_date VARCHAR(8) NOT NULL COMMENT '발생일 (yyyyMMdd)',
  severity VARCHAR(10) DEFAULT NULL COMMENT '심각도 (critical, high, medium, low)',
  weight INT DEFAULT NULL COMMENT '리스크 가중치 (40, 20, 2 등)',
  description VARCHAR(500) DEFAULT NULL COMMENT '이벤트 설명 (한글)',
  audit_opinion_kr VARCHAR(20) DEFAULT NULL COMMENT '감사의견 (적정, 한정, 부적정, 의견거절)',
  UNIQUE KEY UX_DL_RISK_unique (corp_code, event_type, event_date),
  INDEX idx_DL_RISK_corp (corp_code, event_date),
  INDEX idx_DL_RISK_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='리스크 이벤트';
