SET NAMES utf8mb4;
SET time_zone = '+09:00';

-- 검색 가속용(상장사만 자주 조회)
SET @e := (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema=DATABASE() AND table_name='corp_basic' AND index_name='ix_cb_listed_name_code');
SET @sql := IF(@e=0,
  'ALTER TABLE corp_basic ADD INDEX ix_cb_listed_name_code (listed, corp_name, corp_code, stock_code)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
