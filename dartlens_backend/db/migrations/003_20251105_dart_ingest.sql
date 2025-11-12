SET NAMES utf8mb4;
SET time_zone = '+09:00';

CREATE TABLE IF NOT EXISTS corp_basic (
  corp_code CHAR(8) PRIMARY KEY,
  corp_name VARCHAR(255) NOT NULL,
  corp_eng_name VARCHAR(255),
  stock_code CHAR(6),
  listed TINYINT(1) NOT NULL DEFAULT 0,
  modify_date DATE NULL,
  last_sync_at TIMESTAMP NULL,
  KEY ix_stock (stock_code),
  KEY ix_listed (listed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS corp_outline (
  corp_code CHAR(8) PRIMARY KEY,
  stock_code CHAR(6),
  corp_name VARCHAR(255),
  business_overview MEDIUMTEXT,
  main_products MEDIUMTEXT,
  last_update TIMESTAMP NULL,
  KEY ix_outline_stock (stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS financial_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  corp_code CHAR(8) NOT NULL,
  stock_code CHAR(6),
  corp_name VARCHAR(255),
  bsns_year CHAR(4) NOT NULL,
  reprt_code CHAR(5) NOT NULL,      -- 11014 권장
  fs_div ENUM('CFS','OFS') DEFAULT 'CFS',
  account_id VARCHAR(100) NULL,
  account_nm VARCHAR(255) NULL,
  thstrm_amount VARCHAR(64) NULL,
  frmtrm_amount VARCHAR(64) NULL,
  ord SMALLINT NULL,
  last_update TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fact (corp_code, bsns_year, reprt_code, fs_div, account_id),
  KEY ix_fact_corp (corp_code, bsns_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_call_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  endpoint VARCHAR(128) NOT NULL,
  corp_code CHAR(8) NULL,
  params JSON NULL,
  status INT NULL,
  duration_ms INT NULL,
  error_msg TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_api_corp (corp_code),
  KEY ix_api_ep (endpoint, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sync_state (
  name VARCHAR(64) PRIMARY KEY,
  last_hash CHAR(32) NULL,
  last_sync_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
