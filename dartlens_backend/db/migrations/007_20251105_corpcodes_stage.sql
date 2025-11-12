-- 파일: PROTO/dartlens_backend/db/migrations/007_20251105_corpcodes_stage.sql

-- corp_basic_stage: CORPCODE.xml 임시 적재용
CREATE TABLE IF NOT EXISTS corp_basic_stage (
  corp_code  CHAR(8)      NOT NULL,
  corp_name  VARCHAR(200) NOT NULL,
  stock_code CHAR(6)      NULL,
  listed     TINYINT(1)   NOT NULL DEFAULT 0,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (corp_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 인덱스: (listed, corp_code)
SET @idx := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'corp_basic_stage'
    AND index_name   = 'ix_cbs_listed_code'
);
SET @sql := IF(@idx = 0,
  'ALTER TABLE corp_basic_stage ADD INDEX ix_cbs_listed_code (listed, corp_code)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 인덱스: corp_name
SET @idx := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'corp_basic_stage'
    AND index_name   = 'ix_cbs_name'
);
SET @sql := IF(@idx = 0,
  'ALTER TABLE corp_basic_stage ADD INDEX ix_cbs_name (corp_name)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
