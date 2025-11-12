-- db/migrations/004_20251105_multi_year_ingest.sql
SET NAMES utf8mb4;
SET time_zone = '+09:00';

-- ============== 인덱스: financial_reports ==============
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='financial_reports' AND index_name='ix_fr_year'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `financial_reports` ADD INDEX `ix_fr_year` (`bsns_year`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='financial_reports' AND index_name='ix_fr_year_repr_fs'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `financial_reports` ADD INDEX `ix_fr_year_repr_fs` (`bsns_year`,`reprt_code`,`fs_div`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='financial_reports' AND index_name='ix_fr_cov'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `financial_reports` ADD INDEX `ix_fr_cov` (`bsns_year`,`reprt_code`,`fs_div`,`corp_code`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============== 인덱스: corp_basic ==============
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='corp_basic' AND index_name='ix_listed_stock'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `corp_basic` ADD INDEX `ix_listed_stock` (`listed`,`stock_code`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============== 인덱스: api_call_log ==============
SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='api_call_log' AND index_name='ix_api_created'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `api_call_log` ADD INDEX `ix_api_created` (`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='api_call_log' AND index_name='ix_api_ep_time'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `api_call_log` ADD INDEX `ix_api_ep_time` (`endpoint`,`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='api_call_log' AND index_name='ix_api_corp_time'
);
SET @sql := IF(@exists=0, 'ALTER TABLE `api_call_log` ADD INDEX `ix_api_corp_time` (`corp_code`,`created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============== 컬럼 길이 확장: sync_state.name ==============
SET @len := (
  SELECT CHARACTER_MAXIMUM_LENGTH
  FROM information_schema.columns
  WHERE table_schema=DATABASE() AND table_name='sync_state' AND column_name='name'
);
SET @sql := IF(@len IS NOT NULL AND @len < 128, 'ALTER TABLE `sync_state` MODIFY COLUMN `name` VARCHAR(128) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============== 요약 테이블 ==============
CREATE TABLE IF NOT EXISTS fr_yearly_coverage (
  bsns_year CHAR(4) NOT NULL,
  reprt_code CHAR(5) NOT NULL,
  fs_div ENUM('CFS','OFS') NOT NULL DEFAULT 'CFS',
  corps_loaded INT NOT NULL DEFAULT 0,
  rows_loaded BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bsns_year, reprt_code, fs_div)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============== 인제스트 실행 로그 ==============
CREATE TABLE IF NOT EXISTS ingest_run_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  years_json JSON NOT NULL,
  reprt_code CHAR(5) NOT NULL,
  fs_div ENUM('CFS','OFS') NOT NULL DEFAULT 'CFS',
  only_new TINYINT(1) NOT NULL DEFAULT 1,
  resume TINYINT(1) NOT NULL DEFAULT 0,
  processed INT NOT NULL DEFAULT 0,
  status ENUM('RUNNING','OK','ERROR') NOT NULL DEFAULT 'RUNNING',
  error_msg TEXT NULL,
  PRIMARY KEY (id),
  KEY ix_ingest_status (status, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
