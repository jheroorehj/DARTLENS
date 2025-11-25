# DART:Lens

> 금융감독원 DART 공시시스템 기반 기업 재무분석 플랫폼

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

---

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [프로젝트 구조](#프로젝트-구조)
- [설치 및 실행](#설치-및-실행)
- [API 문서](#api-문서)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [변경 이력](#변경-이력)
- [문제 해결](#문제-해결)
- [기여 방법](#기여-방법)
- [라이선스](#라이선스)

---

## 프로젝트 개요

**DART:Lens**는 금융감독원 전자공시시스템(DART) API를 활용하여 국내 상장기업의 재무 데이터를 수집·분석·시각화하는 웹 애플리케이션입니다.

### 버전 정보

- **현재 버전**: V2.2.1
- **최종 수정일**: 2025-11-25
- **작성자**: 장영웅

### 핵심 가치

- **5년치 재무 데이터 분석**: 연간/반기/분기 보고서 통합 조회 (최대 10년 지원)
- **9개 핵심 KPI 자동 계산**: 6개 재무지표 + 3개 비재무지표
- **18개 계정 정규화**: 3-Tier 매핑으로 보고서 형식 통일
- **직관적 시각화**: Recharts 기반 다양한 차트 제공
- **실시간 데이터 동기화**: DART API 연동 자동 업데이트

### 지원 KPI

| 구분 | 지표 | 설명 | 계산식 |
|------|------|------|--------|
| 재무 | ROE | 자기자본이익률 | 당기순이익 / 자본총계 × 100 |
| 재무 | 부채비율 | 재무 건전성 | 부채총계 / 자본총계 × 100 |
| 재무 | 유동비율 | 단기 지급능력 | 유동자산 / 유동부채 × 100 |
| 재무 | 영업이익률 | 본업 수익성 | 영업이익 / 매출액 × 100 |
| 재무 | 매출성장률 | YoY 성장률 | (당해 매출 - 전년 매출) / 전년 매출 × 100 |
| 재무 | EPS | 주당순이익 | 당기순이익 / 발행주식수 |
| 비재무 | 리스크 점수 | 기업 안전성 | 100 - (부도×40 + 회생×40 + 감사×20 + 정지×20 + 소송×2) |
| 비재무 | 거버넌스 점수 | 지배구조 건전성 | 대주주 안정성(4) + 내부자거래(3) + 직원증가(3) |
| 비재무 | 주당배당금 | DPS | DART 공시 기준 주당 현금배당금 |

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.2.0 | UI 프레임워크 |
| React Router | 7.9.5 | 클라이언트 라우팅 |
| Recharts | 3.3.0 | 데이터 시각화 |
| Framer Motion | 12.23.24 | 페이지 트랜지션 |
| Vite | 7.2.2 | 빌드 도구 (개발 서버: 5173) |
| ESLint | 9.39.1 | 코드 품질 |

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 18+ LTS | 런타임 환경 (ES2022, type:module) |
| Express | 4.18.2 | 웹 프레임워크 (포트: 5001) |
| MySQL2 | 3.6.5 | 데이터베이스 드라이버 |
| JWT | 9.0.2 | 인증 토큰 (7일 만료) |
| Bcrypt | 2.4.3 | 비밀번호 해싱 |
| Helmet | 7.1.0 | 보안 헤더 |
| Axios | 1.6.2 | HTTP 클라이언트 (DART API 연동) |
| Cookie Parser | 1.4.6 | 쿠키 파싱 (dl_auth) |

### Database

| 항목 | 내용 |
|------|------|
| DBMS | MySQL 8.0.36+ |
| 인코딩 | utf8mb4 (이모지 지원) |
| 엔진 | InnoDB (트랜잭션 지원) |
| 테이블 수 | 13개 (활성) |
| 명명 규칙 | DL_ 접두사 (DART:Lens 약자) |

### 보안 및 인증

- **JWT 쿠키 인증**: httpOnly, Secure, SameSite=Lax
- **Rate Limiting**: 100 requests/minute
- **CORS**: Cloudflare tunnel 지원
- **Helmet**: 보안 헤더 자동 설정
- **ADMIN_TOKEN**: 관리자 API 헤더 인증

---

## 주요 기능

### 1. 기업 검색
- DART 등록 상장기업 실시간 검색 (listed=1 필터링)
- 회사명, 종목코드(6자리), 법인코드(8자리) 검색 지원
- 검색 결과 캐싱 (DL_CORP_BASIC 테이블)
- 복합 인덱스 최적화 (ix_cb_listed_name_code)

### 2. 사용자 인증
- 회원가입/로그인 (JWT 기반, bcrypt 해싱)
- 세션 유지 옵션: remember=true(30일) / false(2시간)
- 쿠키 기반 보안 인증 (dl_auth)
- 이메일 형식 검증: `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`
- 비밀번호 요구사항: 8자 이상, 문자+숫자 포함

### 3. 관심기업 관리 (Wishlist)
- 기업 저장 및 별칭(alias) 설정
- 우선순위(priority) 관리
- 탭 간 실시간 동기화 (BroadcastChannel API)
- 자동 동기화 옵션 (Auto-sync toggle)
- FK 제약: DL_WISHLIST.user_id → DL_USER.id (CASCADE 삭제)

### 4. 재무 인사이트 대시보드
- **Executive Summary**: 종합 등급 및 투자 권장도
- **9개 KPI 메트릭 카드**: 1:1 비율, 색상 코딩
  - 🟢 우수 (Excellent) | 🟡 양호 (Good) | 🟠 주의 (Warning) | 🔴 위험 (Poor)
- **툴팁 지원**: 각 지표별 계산식 및 설명
- **스파크라인 차트**: 트렌드 미니 차트

### 5. 차트 시각화
- **버블 차트**: 성장성 vs 수익성 매트릭스 (4사분면 분석)
- **산점도**: 지표 간 상관관계 분석 (상관계수, R² 표시)
- **이중축 차트**: 매출성장률 vs 영업이익률
- **그룹 바 차트**: 연도별 복합 지표 비교
- **반응형 디자인**: 16:9 비율, 모바일 최적화

### 6. 데이터 정규화 (V2.0)
- **18개 계정 표준화**: revenue, operating_profit, net_income, total_assets, total_liabilities, total_equity, current_assets, current_liabilities, non_current_assets, non_current_liabilities, inventory, accounts_receivable, accounts_payable, cash, operating_cash_flow, investing_cash_flow, financing_cash_flow, depreciation
- **3-Tier 매핑**: account_id → normalized_account (DL_ACCOUNT_MAPPINGS)
- **보고서 유형 통합**: 11011(1분기) ~ 11014(사업보고서) 자동 우선순위
- **재무제표 구분**: CFS(연결) / OFS(별도)

---

## 프로젝트 구조

```
DARTLENS/
├── dartlens_backend/           # Express API 서버 (BN_WAS)
│   ├── server.js               # 서버 진입점 (포트 5001)
│   ├── .env                    # 환경변수 설정
│   ├── db/
│   │   ├── dartlens.sql        # 전체 DB 스키마 덤프
│   │   └── migrations/         # 001~017 마이그레이션 파일
│   ├── src/
│   │   ├── db.js               # MySQL 연결 풀
│   │   ├── middleware/         # 인증 미들웨어
│   │   │   ├── requireAuth.js  # JWT 검증
│   │   │   └── requireAdmin.js # Admin 토큰 검증
│   │   ├── routes/             # API 라우트 (6개)
│   │   │   ├── auth.js         # 회원가입/로그인/로그아웃
│   │   │   ├── corps.js        # 기업 검색
│   │   │   ├── wishlist.js     # 관심기업 CRUD
│   │   │   ├── insights.js     # Legacy 인사이트
│   │   │   ├── insightsV2.js   # V2.0 정규화 인사이트
│   │   │   └── admin.js        # Admin 통계/백필
│   │   └── services/           # 비즈니스 로직 (9개)
│   │       ├── dartService.js  # DART API 연동
│   │       ├── ingestReports.js # 재무제표 수집
│   │       ├── normalization.js # 18개 계정 정규화
│   │       ├── kpi.js          # 6개 재무 KPI 계산
│   │       ├── risk.js         # 리스크 점수 계산
│   │       ├── governance.js   # 거버넌스 점수 계산
│   │       ├── dividend.js     # 배당금 처리
│   │       ├── insights.js     # Legacy 인사이트
│   │       └── insightsV2.js   # V2.0 인사이트
│   └── scripts/                # 유틸리티 스크립트
│       ├── migrate.mjs         # DB 마이그레이션 실행
│       ├── sync_corpcodes.py   # 기업코드 동기화
│       └── import_corpcodes.mjs # 기업코드 임포트
│
├── dartlens_web/               # React 프론트엔드
│   ├── src/
│   │   ├── main.jsx            # React 진입점
│   │   ├── App.jsx             # 루트 레이아웃 (Topbar + Sidebar + Main + Wishlist)
│   │   ├── components/         # 재사용 컴포넌트
│   │   │   ├── Topbar.jsx      # 헤더 (로고 + 인증 버튼)
│   │   │   ├── Sidebar.jsx     # 좌측 네비게이션
│   │   │   ├── MobileNav.jsx   # 하단 모바일 네비게이션
│   │   │   ├── Wishlist*.jsx   # 관심기업 패널/모달/컨텐츠
│   │   │   └── insights/       # 인사이트 컴포넌트
│   │   │       ├── ExecutiveSummary.jsx  # 종합 요약
│   │   │       ├── InsightCards.jsx      # 스파크라인 카드
│   │   │       ├── MetricsGrid.jsx       # 9개 KPI 그리드
│   │   │       ├── CorrelationCharts.jsx # 상관관계 차트
│   │   │       ├── utils.js              # 유틸리티
│   │   │       └── charts/               # 차트 컴포넌트
│   │   │           ├── BubbleChart.jsx
│   │   │           ├── DualAxisChart.jsx
│   │   │           ├── GroupedBarChart.jsx
│   │   │           └── ScatterCorrelationChart.jsx
│   │   ├── pages/              # 페이지 컴포넌트
│   │   │   ├── Home.jsx        # 검색 페이지
│   │   │   ├── Dashboard.jsx   # 대시보드 (인사이트)
│   │   │   ├── Info.jsx        # 정보 페이지
│   │   │   ├── Login.jsx       # 로그인
│   │   │   └── Signup.jsx      # 회원가입
│   │   ├── context/            # React Context
│   │   │   ├── AuthContext.jsx      # 인증 상태
│   │   │   └── SelectionContext.jsx # 선택 기업 상태
│   │   ├── constants/          # 상수 정의
│   │   │   ├── insightMetrics.js # 9개 KPI 메타데이터
│   │   │   └── navigation.js
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx # 인증 가드
│   │   ├── styles/             # CSS 파일 (4개 통합)
│   │   │   ├── global.css      # 변수, 리셋, 유틸리티
│   │   │   ├── layout.css      # 레이아웃 컴포넌트
│   │   │   ├── pages.css       # 페이지 스타일
│   │   │   └── components.css  # 컴포넌트 스타일
│   │   └── utils/
│   │       ├── formatters.js   # 숫자/날짜 포맷팅
│   │       ├── numberUtils.js  # 숫자 변환
│   │       └── correlation.js  # 상관계수 계산
│   └── public/                 # 정적 자원
│       ├── DL_logo.png
│       ├── DL_favicon.ico
│       └── *_BTN.png / *_SEL.png
│
└── 문서/
    ├── README.md (이 파일)
    ├── BN_WAS_설계서_v2.md
    ├── BN_WAS_API_사용자설계서_v2.md
    └── DB정의서_V4.md
```

---

## 설치 및 실행

### 사전 요구사항

- **Node.js** 18.0.0 이상 (LTS 권장)
- **MySQL** 8.0 이상 (utf8mb4, InnoDB)
- **DART API Key** ([발급받기](https://opendart.fss.or.kr/))

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/dartlens.git
cd dartlens
```

### 2. 백엔드 설정

```bash
cd dartlens_backend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# 또는 수동 생성
```

**.env 파일 필수 설정:**

```env
# 서버 설정
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# 데이터베이스
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=dartlens

# JWT 인증
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRES=7d

# DART API
DART_API_KEY=your_dart_api_key_from_opendart

# 관리자
ADMIN_TOKEN=your_admin_token_change_in_production

# 자동 마이그레이션 (옵션)
MIGRATE_ON_BOOT=false

# 기업코드 자동 동기화 (옵션)
CORPCODE_AUTO_SYNC=0
```

### 3. 데이터베이스 초기화

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE dartlens CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 마이그레이션 실행 (001~017 순차 실행)
cd dartlens_backend
npm run db:migrate
```

**마이그레이션 파일 목록:**
- `001_initial_schema.sql` ~ `017_rename_tables_dl_prefix.sql`
- 자동 실행: `MIGRATE_ON_BOOT=true` 설정 시 서버 기동 시 자동

### 4. 프론트엔드 설정

```bash
cd ../dartlens_web

# 의존성 설치
npm install

# .env.local (프로덕션 시)
echo "VITE_API_URL=" > .env.local
# 빈 값 = same origin (프로덕션 권장)
```

### 5. 실행

**개발 모드:**

```bash
# 터미널 1: 백엔드 (nodemon auto-restart)
cd dartlens_backend
npm run dev
# → http://localhost:5001

# 터미널 2: 프론트엔드 (Vite HMR)
cd dartlens_web
npm run dev
# → http://localhost:5173
```

**프로덕션 모드:**

```bash
cd dartlens_backend

# 프론트엔드 빌드 + 서버 실행
npm run serve
# → http://localhost:5001 (정적 파일 서빙 포함)

# 또는 분리 실행
cd ../dartlens_web
npm run build

cd ../dartlens_backend
npm start
```

### 접속 URL

- **개발 모드**: <http://localhost:5173>
- **프로덕션**: <http://localhost:5001>

---

## API 문서

### Base URL

- **개발**: `http://localhost:5001/api`
- **운영**: `https://api.dartlens.com/api`

### 공통 응답 형식

**성공:**
```json
{
  "ok": true,
  "data": { ... }
}
```

**실패:**
```json
{
  "ok": false,
  "code": "ERROR_CODE",
  "message": "상세 메시지"
}
```

### 인증 API

#### 회원가입
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123",
  "agreeMarketing": false
}
```

**응답 (200):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "name": "홍길동",
      "email": "user@example.com"
    }
  }
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}
```

**응답 (200):**
- 쿠키: `dl_auth` (httpOnly, Secure, SameSite=Lax)
- Body:
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "name": "홍길동",
      "email": "user@example.com"
    }
  }
}
```

### 기업 검색 API

```http
GET /api/corps/search?query=삼성&limit=20
Cookie: dl_auth=<JWT_TOKEN>
```

**응답:**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "corp_code": "00126380",
        "corp_name": "삼성전자",
        "stock_code": "005930"
      }
    ]
  }
}
```

### 인사이트 API (V2.0)

```http
GET /api/insights/v2/:corp_code?years=5&fs=CFS
Cookie: dl_auth=<JWT_TOKEN>
```

**쿼리 파라미터:**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| years | number | 5 | 조회 연도 수 (1-10) |
| years_list | string | - | 쉼표 구분 연도 목록 (예: '2021,2022,2023') |
| reprt | string | auto | 보고서 유형 (auto/11011/11012/11013/11014) |
| fs | string | CFS | 재무제표 유형 (CFS=연결, OFS=별도) |

**응답:**
```json
{
  "ok": true,
  "data": {
    "corp_code": "00126380",
    "corp_name": "삼성전자",
    "stock_code": "005930",
    "listed": 1,
    "snapshots": [
      {
        "year": "2023",
        "reprt_code": "11011",
        "financials": {
          "revenue": 258935000000000,
          "operating_profit": 6566000000000,
          "net_income": 15603000000000,
          "total_assets": 448593000000000,
          "total_liabilities": 107205000000000,
          "total_equity": 341388000000000
        },
        "kpis": {
          "roe": 4.57,
          "debtRatio": 31.41,
          "currentRatio": 229.66,
          "operatingMargin": 2.54,
          "revenueGrowth": -3.85,
          "eps": 2150
        },
        "nonFinancialMetrics": {
          "riskScore": 100,
          "governanceScore": 8.5,
          "dividendPerShare": 361
        }
      }
    ],
    "summary": {
      "totalYears": 5,
      "yearsWithData": 5,
      "avgKpisCalculated": 9
    }
  }
}
```

### 관리자 API

#### 인사이트 재계산 (Sync)
```http
POST /api/insights/v2/sync
X-Admin-Token: <ADMIN_TOKEN>
Content-Type: application/json

{
  "corp_code": "00126380",
  "years": 5,
  "reprt": "auto",
  "fs": "CFS"
}
```

**응답:**
```json
{
  "ok": true,
  "message": "인사이트 재계산 완료",
  "data": {
    "processedYears": 5
  }
}
```

---

## 데이터베이스 스키마

### 핵심 테이블 (13개)

| No | 테이블명 | 논리명 | 레코드수 | 비고 |
|----|---------|--------|----------|------|
| 1 | DL_USER | 사용자 | 16 | 핵심 |
| 2 | DL_WISHLIST | 위시리스트 | 25 | 핵심 |
| 3 | DL_CORP_BASIC | 기업 기본정보 | 109,222 | 핵심 |
| 4 | DL_CORP_BASIC_STAGE | 기업정보 스테이징 | 3,777 | 배치용 |
| 5 | DL_FINANCIAL_REPORTS | 재무제표 원본 | 126,462 | 핵심 |
| 6 | DL_NORMALIZED_FINANCIALS | 정규화 재무제표 | 30 | V2.0 |
| 7 | DL_FINANCIAL_KPIS | KPI 캐시 | 30 | V2.0 |
| 8 | DL_ACCOUNT_MAPPINGS | 계정과목 매핑 | 18 | V2.0 |
| 9 | DL_RISK_EVENTS | 리스크 이벤트 | 25 | V2.0 |
| 10 | DL_GOVERNANCE_DATA | 거버넌스 데이터 | 5 | V2.0 |
| 11 | DL_DIVIDENDS | 배당 데이터 | 0 | V2.0 |
| 12 | DL_API_CALL_LOG | API 호출 로그 | 11,398 | 모니터링 |
| 13 | DL_APPLIED_MIGRATIONS | 마이그레이션 이력 | 18 | 시스템 |

### ERD 개요

```
DL_USER (1) ──────< (N) DL_WISHLIST
                            │
                            ↓ (corp_code 참조)
DL_CORP_BASIC (1) ────< (N) DL_FINANCIAL_REPORTS
      │                     │
      │                     ↓ (정규화)
      │               DL_NORMALIZED_FINANCIALS
      │                     │
      │                     ↓ (KPI 계산)
      │               DL_FINANCIAL_KPIS
      │
      ├─────────────> DL_RISK_EVENTS
      ├─────────────> DL_GOVERNANCE_DATA
      └─────────────> DL_DIVIDENDS

DL_ACCOUNT_MAPPINGS (18개 매핑 규칙)
      └─────────────> DL_NORMALIZED_FINANCIALS (참조)
```

### 주요 컬럼 설명

**DL_USER**
- `id`: BIGINT UNSIGNED AUTO_INCREMENT (PK)
- `email`: VARCHAR(255), UNIQUE (로그인 ID)
- `password_hash`: VARCHAR(255) (bcrypt)

**DL_CORP_BASIC**
- `corp_code`: CHAR(8) (PK, DART 코드)
- `stock_code`: CHAR(6) (종목코드, 상장사만)
- `listed`: TINYINT(1) (0=비상장, 1=상장)

**DL_NORMALIZED_FINANCIALS**
- 18개 표준 계정: revenue, operating_profit, net_income, ...
- UNIQUE: (corp_code, bsns_year, reprt_code, fs_div)

**DL_FINANCIAL_KPIS**
- 9개 KPI: roe, debt_ratio, current_ratio, operating_margin, revenue_growth, eps, risk_score, governance_score, dividend_per_share
- UNIQUE: (corp_code, bsns_year, reprt_code, fs_div)

---

## 변경 이력

### V2.2.1 (2025-11)

**주요 변경사항:**

1. **테이블명 통합 규칙**
   - 모든 테이블에 `DL_` 접두사 적용 (DART:Lens 약자)
   - 레거시 8개 테이블명 변경: users → DL_USER, wishlist → DL_WISHLIST 등
   - 미사용 5개 테이블 삭제: corp_outline, dashboard_prefs, fr_yearly_coverage, ingest_run_log, sync_state

2. **18개 계정 정규화 시스템**
   - `DL_ACCOUNT_MAPPINGS`: 3-Tier 매핑 규칙
   - `DL_NORMALIZED_FINANCIALS`: 표준화된 재무제표
   - 보고서 형식 통일 (11011~11014, CFS/OFS)

3. **9개 KPI 자동 계산 엔진**
   - `DL_FINANCIAL_KPIS`: 계산 결과 캐시 테이블
   - 6개 재무 KPI: ROE, 부채비율, 유동비율, 영업이익률, 매출성장률, EPS
   - 3개 비재무 지표: 리스크 점수, 거버넌스 점수, 주당배당금

4. **반응형 UI 개선**
   - 모바일: 3x3 그리드, 1:1 비율 카드
   - 태블릿: 3x2 그리드
   - 데스크탑: 6x1 그리드 (재무지표 한 줄 배치)
   - 차트 16:9 비율, 모바일 전체 너비 확장

5. **차트 시각화 강화**
   - 버블 차트, 산점도, 이중축 차트, 그룹 바 차트
   - 툴팁 지원 (데스크탑: 버튼 위, 모바일: 화면 중앙)
   - 상관관계 분석 (상관계수, R², 추세선)

**마이그레이션:**
- 총 17개 마이그레이션 파일 (001~017)
- `npm run db:migrate` 명령으로 순차 실행
- 자동 실행: `MIGRATE_ON_BOOT=true` 설정 시

**문서 버전:**
- BN_WAS 설계서: v2.0
- BN_WAS API 사용자설계서: v2.1.0
- DB 정의서: V2.2.0 (2025-11-23)

---

## 문제 해결

### 자주 발생하는 오류

**1. MySQL 연결 실패**
```
Error: Access denied for user 'root'@'localhost'
```
→ `.env` 파일의 `MYSQL_PASSWORD` 확인
→ MySQL 서비스 실행 여부 확인: `sudo service mysql status`

**2. DART API 오류**
```
Error: Invalid API Key
```
→ [opendart.fss.or.kr](https://opendart.fss.or.kr)에서 API Key 재발급
→ `.env` 파일의 `DART_API_KEY` 업데이트

**3. 포트 충돌**
```
Error: EADDRINUSE: address already in use :::5001
```
→ 기존 프로세스 종료:
```bash
lsof -i :5001
kill -9 <PID>
```

**4. 마이그레이션 오류**
```
Error: Migration 017 already applied
```
→ `DL_APPLIED_MIGRATIONS` 테이블 확인:
```sql
SELECT * FROM DL_APPLIED_MIGRATIONS ORDER BY applied_at DESC;
```
→ 중복 실행 방지: `MIGRATE_ON_BOOT=false` 설정

**5. JWT 토큰 만료**
```json
{ "ok": false, "code": "TOKEN_REQUIRED" }
```
→ 쿠키 확인: 브라우저 개발자 도구 > Application > Cookies
→ 재로그인: `/api/auth/login`

**6. 빌드 오류**
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 클리어 (Vite)
rm -rf node_modules/.vite
npm run dev
```

**7. CORS 오류 (개발 시)**
```
Access to fetch at 'http://localhost:5001' from origin 'http://localhost:5173' has been blocked by CORS policy
```
→ `.env` 확인: `CORS_ORIGIN=http://localhost:5173`
→ 백엔드 재시작: `npm run dev`

---

## 기여 방법

### 개발 워크플로우

1. **Fork** 저장소를 본인 계정으로 포크
2. **Clone** 로컬에 클론
   ```bash
   git clone https://github.com/your-username/dartlens.git
   cd dartlens
   ```
3. **Branch** 기능 브랜치 생성
   ```bash
   git checkout -b feature/기능명
   # 또는
   git checkout -b fix/버그명
   ```
4. **Commit** 변경사항 커밋 (컨벤션 준수)
   ```bash
   git commit -m "feat: 새로운 KPI 추가"
   ```
5. **Push** 원격 저장소에 푸시
   ```bash
   git push origin feature/기능명
   ```
6. **Pull Request** PR 생성
   - 제목: `[feat] 새로운 KPI 추가`
   - 본문: 변경 사항 상세 설명
   - 리뷰어 지정

### 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정 (README, 주석)
style: 코드 포맷팅 (세미콜론, 공백 등)
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 설정 변경, 패키지 업데이트
perf: 성능 최적화
```

**예시:**
```bash
git commit -m "feat: 주당순자산가치(BPS) KPI 추가"
git commit -m "fix: 부채비율 계산 오류 수정 (total_equity 0 처리)"
git commit -m "docs: API 문서에 years_list 파라미터 추가"
```

### 코드 스타일

- **Backend**: ESLint 규칙 준수 (ES2022, type:module)
- **Frontend**: React Hooks, functional components 사용
- **CSS**: Vanilla CSS, BEM 네이밍
- **변수명**: camelCase (JS), snake_case (DB)
- **주석**: JSDoc 스타일 권장

---

## 라이선스

이 프로젝트는 **ISC License** 하에 배포됩니다.

```
ISC License

Copyright (c) 2025 DART:Lens Team

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 개발자 정보

**DART:Lens Team**

- **프로젝트 관리**: DOUZONE
- **개발 기간**: 2025.01 ~
- **개발자**: 장영웅
- **버전**: V2.2.1
- **최종 수정일**: 2025-11-25

---

<p align="center">
  <strong>DART:Lens</strong> - 더 나은 투자 결정을 위한 재무분석 플랫폼
</p>

<p align="center">
  Built with ❤️ using React, Express, and MySQL
</p>
