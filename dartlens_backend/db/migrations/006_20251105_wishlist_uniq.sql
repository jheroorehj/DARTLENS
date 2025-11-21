SET NAMES utf8mb4; SET time_zone = '+09:00';

-- 중복 방지 키
SET @e := (SELECT COUNT(*) FROM information_schema.statistics
           WHERE table_schema=DATABASE() AND table_name='wishlist' AND index_name='uq_wishlist_user_corp');
SET @sql := IF(@e=0,
  'ALTER TABLE wishlist ADD UNIQUE KEY uq_wishlist_user_corp (user_id, corp_code)',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
