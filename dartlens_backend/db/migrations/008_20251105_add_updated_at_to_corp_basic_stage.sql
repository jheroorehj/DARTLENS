-- hotfix: corp_basic_stage.updated_at 보강
-- 없으면 추가, 있으면 건너뜀
SET @col := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name   = 'corp_basic_stage'
    AND column_name  = 'updated_at'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE corp_basic_stage ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 인덱스 재확인(이미 있으시면 그대로 통과)
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
