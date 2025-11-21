-- Create financial_kpis table to cache computed metrics per corporation/year
CREATE TABLE IF NOT EXISTS financial_kpis (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  corp_code CHAR(8) NOT NULL,
  bsns_year CHAR(4) NOT NULL,
  reprt_code CHAR(5) NOT NULL,
  fs_div ENUM('CFS','OFS') NOT NULL DEFAULT 'CFS',
  roe DECIMAL(18,4) DEFAULT NULL,
  debt_ratio DECIMAL(18,4) DEFAULT NULL,
  current_ratio DECIMAL(18,4) DEFAULT NULL,
  operating_margin DECIMAL(18,4) DEFAULT NULL,
  revenue_growth DECIMAL(18,4) DEFAULT NULL,
  eps DECIMAL(18,4) DEFAULT NULL,
  risk_score DECIMAL(18,4) DEFAULT NULL,
  governance_score DECIMAL(18,4) DEFAULT NULL,
  dividend_per_share DECIMAL(18,4) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_financial_kpis (corp_code, bsns_year, reprt_code, fs_div),
  KEY ix_financial_kpis_corp_year (corp_code, bsns_year, fs_div)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
