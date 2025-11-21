-- V2.0: 18개 핵심 계정 매핑 초기 데이터
-- 3-Tier 정규화를 위한 계정과목 매핑 (XBRL ID, 한글명, Alias)

INSERT INTO DL_ACCOUNT_MAPPINGS (TBLKEY, normalized_key, normalized_name_kr, xbrl_account_id, primary_kr_name, alias_1, alias_2, alias_3, category)
VALUES
-- 1. 매출액
(REPLACE(UUID(), '-', ''), 'REVENUE', '매출액', 'ifrs-full_Revenue', '매출액', '수익(매출액)', '영업수익', NULL, 'IS'),

-- 2. 영업이익
(REPLACE(UUID(), '-', ''), 'OPERATING_PROFIT', '영업이익', 'ifrs-full_OperatingIncomeLoss', '영업이익', '영업이익(손실)', '영업손익', NULL, 'IS'),

-- 3. 당기순이익 (⚠️ Critical Aliases)
(REPLACE(UUID(), '-', ''), 'NET_INCOME', '당기순이익', 'ifrs-full_ProfitLoss', '당기순이익', '연결당기순이익', '계속영업연결당기순이익', '분기순이익', 'IS'),

-- 4. 자산총계
(REPLACE(UUID(), '-', ''), 'TOTAL_ASSETS', '자산총계', 'ifrs-full_Assets', '자산총계', '자산 총계', '자산', NULL, 'BS'),

-- 5. 부채총계
(REPLACE(UUID(), '-', ''), 'TOTAL_LIABILITIES', '부채총계', 'ifrs-full_Liabilities', '부채총계', '부채 총계', '부채', NULL, 'BS'),

-- 6. 자본총계
(REPLACE(UUID(), '-', ''), 'TOTAL_EQUITY', '자본총계', 'ifrs-full_Equity', '자본총계', '자본 총계', '자본', NULL, 'BS'),

-- 7. 유동자산
(REPLACE(UUID(), '-', ''), 'CURRENT_ASSETS', '유동자산', 'ifrs-full_CurrentAssets', '유동자산', 'Ⅰ.유동자산', 'I.유동자산', NULL, 'BS'),

-- 8. 유동부채
(REPLACE(UUID(), '-', ''), 'CURRENT_LIABILITIES', '유동부채', 'ifrs-full_CurrentLiabilities', '유동부채', 'Ⅰ.유동부채', 'I.유동부채', NULL, 'BS'),

-- 9. 비유동자산
(REPLACE(UUID(), '-', ''), 'NON_CURRENT_ASSETS', '비유동자산', 'ifrs-full_NoncurrentAssets', '비유동자산', 'Ⅱ.비유동자산', 'II.비유동자산', NULL, 'BS'),

-- 10. 비유동부채
(REPLACE(UUID(), '-', ''), 'NON_CURRENT_LIABILITIES', '비유동부채', 'ifrs-full_NoncurrentLiabilities', '비유동부채', 'Ⅱ.비유동부채', 'II.비유동부채', NULL, 'BS'),

-- 11. 재고자산
(REPLACE(UUID(), '-', ''), 'INVENTORY', '재고자산', 'ifrs-full_Inventories', '재고자산', '재고', '상품', NULL, 'BS'),

-- 12. 매출채권
(REPLACE(UUID(), '-', ''), 'ACCOUNTS_RECEIVABLE', '매출채권', 'ifrs-full_TradeAndOtherCurrentReceivables', '매출채권', '매출채권및기타채권', '단기매출채권', NULL, 'BS'),

-- 13. 매입채무
(REPLACE(UUID(), '-', ''), 'ACCOUNTS_PAYABLE', '매입채무', 'ifrs-full_TradeAndOtherCurrentPayables', '매입채무', '매입채무및기타채무', '단기매입채무', NULL, 'BS'),

-- 14. 현금및현금성자산
(REPLACE(UUID(), '-', ''), 'CASH', '현금및현금성자산', 'ifrs-full_CashAndCashEquivalents', '현금및현금성자산', '현금 및 현금성자산', '현금성자산', NULL, 'BS'),

-- 15. 영업활동현금흐름
(REPLACE(UUID(), '-', ''), 'OPERATING_CASH_FLOW', '영업활동현금흐름', 'ifrs-full_CashFlowsFromUsedInOperatingActivities', '영업활동현금흐름', '영업활동으로인한현금흐름', '영업활동 현금흐름', NULL, 'CF'),

-- 16. 투자활동현금흐름
(REPLACE(UUID(), '-', ''), 'INVESTING_CASH_FLOW', '투자활동현금흐름', 'ifrs-full_CashFlowsFromUsedInInvestingActivities', '투자활동현금흐름', '투자활동으로인한현금흐름', '투자활동 현금흐름', NULL, 'CF'),

-- 17. 재무활동현금흐름
(REPLACE(UUID(), '-', ''), 'FINANCING_CASH_FLOW', '재무활동현금흐름', 'ifrs-full_CashFlowsFromUsedInFinancingActivities', '재무활동현금흐름', '재무활동으로인한현금흐름', '재무활동 현금흐름', NULL, 'CF'),

-- 18. 감가상각비
(REPLACE(UUID(), '-', ''), 'DEPRECIATION', '감가상각비', 'ifrs-full_DepreciationAndAmortisationExpense', '감가상각비', '감가상각비 및 무형자산상각비', '감가상각', NULL, 'CF');
