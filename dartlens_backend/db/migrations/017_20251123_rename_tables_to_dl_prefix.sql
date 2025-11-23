-- ================================================================
-- Migration 017: 테이블명 V2.0 명명규칙 통일 (DL_ 접두사)
-- Date: 2025-11-23
-- Description: 레거시 테이블명을 V2.0 명명규칙(DL_ 접두사)으로 변경
-- ================================================================

-- 1. FK 제약조건 제거
ALTER TABLE wishlist DROP FOREIGN KEY IF EXISTS fk_wishlist_user;

-- 2. 테이블명 변경 (8개)
RENAME TABLE
  users TO DL_USER,
  wishlist TO DL_WISHLIST,
  corp_basic TO DL_CORP_BASIC,
  corp_basic_stage TO DL_CORP_BASIC_STAGE,
  financial_reports TO DL_FINANCIAL_REPORTS,
  financial_kpis TO DL_FINANCIAL_KPIS,
  api_call_log TO DL_API_CALL_LOG,
  applied_migrations TO DL_APPLIED_MIGRATIONS;

-- 3. FK 제약조건 재생성
ALTER TABLE DL_WISHLIST
ADD CONSTRAINT fk_wishlist_user
FOREIGN KEY (user_id) REFERENCES DL_USER(id) ON DELETE CASCADE;

-- ================================================================
-- Rollback Script (주석 처리)
-- ================================================================
-- ALTER TABLE DL_WISHLIST DROP FOREIGN KEY IF EXISTS fk_wishlist_user;
-- RENAME TABLE
--   DL_USER TO users,
--   DL_WISHLIST TO wishlist,
--   DL_CORP_BASIC TO corp_basic,
--   DL_CORP_BASIC_STAGE TO corp_basic_stage,
--   DL_FINANCIAL_REPORTS TO financial_reports,
--   DL_FINANCIAL_KPIS TO financial_kpis,
--   DL_API_CALL_LOG TO api_call_log,
--   DL_APPLIED_MIGRATIONS TO applied_migrations;
-- ALTER TABLE wishlist
-- ADD CONSTRAINT fk_wishlist_user
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;