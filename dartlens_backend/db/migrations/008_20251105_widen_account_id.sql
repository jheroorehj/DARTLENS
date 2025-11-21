-- db/migrations/008_20251105_widen_account_id.sql
-- 목적: OpenDART account_id 길이 대응
-- 이유: utf8mb4 인덱스 호환을 위해 191 사용

START TRANSACTION;

-- 1) 컬럼 길이 확대
ALTER TABLE financial_reports
  MODIFY COLUMN account_id VARCHAR(191) NOT NULL,
  MODIFY COLUMN account_nm VARCHAR(255) NULL;

-- 2) account_id가 인덱스/PK 일부라면 길이 지정이 필요한 경우 재생성 예시
-- 주: 아래는 예시입니다. 실제 키 이름 확인 후 조정하세요.
-- ALTER TABLE financial_reports DROP INDEX ux_corp_year_code_fs_acc;
-- CREATE UNIQUE INDEX ux_corp_year_code_fs_acc
--   ON financial_reports (corp_code, bsns_year, reprt_code, fs_div, account_id);

COMMIT;
