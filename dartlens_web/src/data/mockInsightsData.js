export const SAMSUNG_INSIGHTS = {
  corpCode: "00126380",
  corpName: "삼성전자",
  timeSeries: [
    {
      year: "2024",
      rawAccounts: {
        revenue: 258000000000000,
        operatingProfit: 35000000000000,
        netIncome: 23000000000000,
        totalAssets: 448000000000000,
        totalLiabilities: 107000000000000,
        totalEquity: 341000000000000,
        currentAssets: 185000000000000,
        currentLiabilities: 67000000000000,
      },
      kpis: {
        // Financial KPIs
        roe: 6.74,
        debtRatio: 31.38,
        currentRatio: 276.12,
        operatingMargin: 13.57,
        revenueGrowth: -14.64,
        eps: 3540, // 주당순이익 (원)
        // Non-Financial Metrics
        riskScore: 100, // 리스크 점수 (0-100, 높을수록 안전)
        governanceScore: 9.2, // 거버넌스 점수 (0-10, 높을수록 우수)
        dividendPerShare: 1444, // 주당배당금 (원)
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2023",
      rawAccounts: {
        revenue: 302000000000000,
        operatingProfit: 43000000000000,
        netIncome: 35000000000000,
        totalAssets: 426000000000000,
        totalLiabilities: 97000000000000,
        totalEquity: 329000000000000,
        currentAssets: 178000000000000,
        currentLiabilities: 63000000000000,
      },
      kpis: {
        roe: 10.64,
        debtRatio: 29.48,
        currentRatio: 282.54,
        operatingMargin: 14.24,
        revenueGrowth: 8.29,
        eps: 5390,
        riskScore: 100,
        governanceScore: 9.0,
        dividendPerShare: 1416,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2022",
      rawAccounts: {
        revenue: 279000000000000,
        operatingProfit: 51000000000000,
        netIncome: 55000000000000,
        totalAssets: 399000000000000,
        totalLiabilities: 92000000000000,
        totalEquity: 307000000000000,
        currentAssets: 165000000000000,
        currentLiabilities: 58000000000000,
      },
      kpis: {
        roe: 17.92,
        debtRatio: 29.97,
        currentRatio: 284.48,
        operatingMargin: 18.28,
        revenueGrowth: 7.73,
        eps: 8460,
        riskScore: 100,
        governanceScore: 8.8,
        dividendPerShare: 1361,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2021",
      rawAccounts: {
        revenue: 259000000000000,
        operatingProfit: 52000000000000,
        netIncome: 39000000000000,
        totalAssets: 378000000000000,
        totalLiabilities: 102000000000000,
        totalEquity: 276000000000000,
        currentAssets: 161000000000000,
        currentLiabilities: 69000000000000,
      },
      kpis: {
        roe: 14.13,
        debtRatio: 36.96,
        currentRatio: 233.33,
        operatingMargin: 20.08,
        revenueGrowth: 18.61,
        eps: 6006,
        riskScore: 100,
        governanceScore: 8.6,
        dividendPerShare: 1420,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2020",
      rawAccounts: {
        revenue: 218000000000000,
        operatingProfit: 36000000000000,
        netIncome: 26000000000000,
        totalAssets: 352000000000000,
        totalLiabilities: 102000000000000,
        totalEquity: 250000000000000,
        currentAssets: 181000000000000,
        currentLiabilities: 69000000000000,
      },
      kpis: {
        roe: 10.40,
        debtRatio: 40.80,
        currentRatio: 262.32,
        operatingMargin: 16.51,
        revenueGrowth: null, // First year - no YoY data
        eps: 4007,
        riskScore: 100,
        governanceScore: 8.5,
        dividendPerShare: 1416,
      },
      metadata: {
        missingFields: ["revenueGrowth"],
        dataSource: "DART API",
      },
    },
  ],
  riskData: {
    riskScore: 100,
    riskGrade: "매우안전",
    events: [],
  },
};

/**
 * Hyundai Motor (00164742) - Large Cap Automotive
 * Realistic data with some volatility
 */
export const HYUNDAI_INSIGHTS = {
  corpCode: "00164742",
  corpName: "현대자동차",
  timeSeries: [
    {
      year: "2024",
      rawAccounts: {
        revenue: 168000000000000,
        operatingProfit: 15200000000000,
        netIncome: 11500000000000,
        totalAssets: 268000000000000,
        totalLiabilities: 179000000000000,
        totalEquity: 89000000000000,
        currentAssets: 98000000000000,
        currentLiabilities: 87000000000000,
      },
      kpis: {
        roe: 12.92,
        debtRatio: 201.12,
        currentRatio: 112.64,
        operatingMargin: 9.05,
        revenueGrowth: 8.39,
        eps: 45800,
        riskScore: 95,
        governanceScore: 7.8,
        dividendPerShare: 12000,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2023",
      rawAccounts: {
        revenue: 155000000000000,
        operatingProfit: 11800000000000,
        netIncome: 8900000000000,
        totalAssets: 255000000000000,
        totalLiabilities: 172000000000000,
        totalEquity: 83000000000000,
        currentAssets: 92000000000000,
        currentLiabilities: 83000000000000,
      },
      kpis: {
        roe: 10.72,
        debtRatio: 207.23,
        currentRatio: 110.84,
        operatingMargin: 7.61,
        revenueGrowth: 16.54,
        eps: 35400,
        riskScore: 95,
        governanceScore: 7.6,
        dividendPerShare: 10000,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2022",
      rawAccounts: {
        revenue: 133000000000000,
        operatingProfit: 9500000000000,
        netIncome: 7200000000000,
        totalAssets: 242000000000000,
        totalLiabilities: 165000000000000,
        totalEquity: 77000000000000,
        currentAssets: 85000000000000,
        currentLiabilities: 79000000000000,
      },
      kpis: {
        roe: 9.35,
        debtRatio: 214.29,
        currentRatio: 107.59,
        operatingMargin: 7.14,
        revenueGrowth: 21.10,
        eps: 28600,
        riskScore: 95,
        governanceScore: 7.4,
        dividendPerShare: 9000,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2021",
      rawAccounts: {
        revenue: 110000000000000,
        operatingProfit: 6700000000000,
        netIncome: 5100000000000,
        totalAssets: 228000000000000,
        totalLiabilities: 158000000000000,
        totalEquity: 70000000000000,
        currentAssets: 78000000000000,
        currentLiabilities: 75000000000000,
      },
      kpis: {
        roe: 7.29,
        debtRatio: 225.71,
        currentRatio: 104.00,
        operatingMargin: 6.09,
        revenueGrowth: 12.24,
        eps: 20300,
        riskScore: 93,
        governanceScore: 7.2,
        dividendPerShare: 7000,
      },
      metadata: {
        missingFields: [],
        dataSource: "DART API",
      },
    },
    {
      year: "2020",
      rawAccounts: {
        revenue: 98000000000000,
        operatingProfit: 2900000000000,
        netIncome: 1800000000000,
        totalAssets: 215000000000000,
        totalLiabilities: 152000000000000,
        totalEquity: 63000000000000,
        currentAssets: 71000000000000,
        currentLiabilities: 72000000000000,
      },
      kpis: {
        roe: 2.86,
        debtRatio: 241.27,
        currentRatio: 98.61,
        operatingMargin: 2.96,
        revenueGrowth: null,
        eps: 7200,
        riskScore: 90,
        governanceScore: 7.0,
        dividendPerShare: 2500,
      },
      metadata: {
        missingFields: ["revenueGrowth"],
        dataSource: "DART API",
      },
    },
  ],
  riskData: {
    riskScore: 95,
    riskGrade: "안전",
    events: [],
  },
};

/**
 * Small Cap Company - With some missing data (realistic scenario)
 */
export const SMALL_CAP_INSIGHTS = {
  corpCode: "00131780",
  corpName: "중소기업 샘플",
  timeSeries: [
    {
      year: "2024",
      rawAccounts: {
        revenue: 2042849000000,
        operatingProfit: 28642000000,
        netIncome: 65836000000,
        totalAssets: 5877757000000,
        totalLiabilities: 3730341000000,
        totalEquity: 2147416000000,
        currentAssets: 2602314000000,
        currentLiabilities: 2479548000000,
      },
      kpis: {
        roe: 3.07,
        debtRatio: 173.69,
        currentRatio: 104.95,
        operatingMargin: 1.40,
        revenueGrowth: null, // Missing previous year data
        eps: 850,
        riskScore: 88,
        governanceScore: 6.2,
        dividendPerShare: null, // No dividend
      },
      metadata: {
        missingFields: ["revenueGrowth", "dividendPerShare"],
        dataSource: "DART API",
      },
    },
    {
      year: "2023",
      rawAccounts: {
        revenue: 1950000000000,
        operatingProfit: 25000000000,
        netIncome: null, // Missing data scenario
        totalAssets: 5600000000000,
        totalLiabilities: 3550000000000,
        totalEquity: 2050000000000,
        currentAssets: 2450000000000,
        currentLiabilities: 2380000000000,
      },
      kpis: {
        roe: null, // Can't calculate without net income
        debtRatio: 173.17,
        currentRatio: 102.94,
        operatingMargin: 1.28,
        revenueGrowth: 5.95,
        eps: null,
        riskScore: 86,
        governanceScore: 6.0,
        dividendPerShare: null,
      },
      metadata: {
        missingFields: ["netIncome", "roe", "eps", "dividendPerShare"],
        dataSource: "DART API",
      },
    },
    {
      year: "2022",
      rawAccounts: {
        revenue: 1840000000000,
        operatingProfit: 22000000000,
        netIncome: 48000000000,
        totalAssets: 5400000000000,
        totalLiabilities: 3450000000000,
        totalEquity: 1950000000000,
        currentAssets: 2350000000000,
        currentLiabilities: 2300000000000,
      },
      kpis: {
        roe: 2.46,
        debtRatio: 176.92,
        currentRatio: 102.17,
        operatingMargin: 1.20,
        revenueGrowth: 15.00,
        eps: 620,
        riskScore: 84,
        governanceScore: 5.8,
        dividendPerShare: null,
      },
      metadata: {
        missingFields: ["dividendPerShare"],
        dataSource: "DART API",
      },
    },
    {
      year: "2021",
      rawAccounts: {
        revenue: 1600000000000,
        operatingProfit: 18000000000,
        netIncome: 35000000000,
        totalAssets: 5200000000000,
        totalLiabilities: 3350000000000,
        totalEquity: 1850000000000,
        currentAssets: 2250000000000,
        currentLiabilities: 2250000000000,
      },
      kpis: {
        roe: 1.89,
        debtRatio: 181.08,
        currentRatio: 100.00,
        operatingMargin: 1.13,
        revenueGrowth: 6.67,
        eps: 452,
        riskScore: 82,
        governanceScore: 5.6,
        dividendPerShare: null,
      },
      metadata: {
        missingFields: ["dividendPerShare"],
        dataSource: "DART API",
      },
    },
    {
      year: "2020",
      rawAccounts: {
        revenue: 1500000000000,
        operatingProfit: 15000000000,
        netIncome: 28000000000,
        totalAssets: 5000000000000,
        totalLiabilities: 3250000000000,
        totalEquity: 1750000000000,
        currentAssets: 2150000000000,
        currentLiabilities: 2200000000000,
      },
      kpis: {
        roe: 1.60,
        debtRatio: 185.71,
        currentRatio: 97.73,
        operatingMargin: 1.00,
        revenueGrowth: null,
        eps: 362,
        riskScore: 80,
        governanceScore: 5.4,
        dividendPerShare: null,
      },
      metadata: {
        missingFields: ["revenueGrowth", "dividendPerShare"],
        dataSource: "DART API",
      },
    },
  ],
  riskData: {
    riskScore: 88,
    riskGrade: "보통",
    events: [
      {
        type: "LITIGATION",
        date: "20230615",
        description: "소송 제기 (금액: 5억원)",
      },
    ],
  },
};

/**
 * All mock companies for easy access
 */
export const MOCK_COMPANIES = {
  "00126380": SAMSUNG_INSIGHTS,
  "00164742": HYUNDAI_INSIGHTS,
  "00131780": SMALL_CAP_INSIGHTS,
};

/**
 * Mock wishlist data
 */
export const MOCK_WISHLIST = [
  {
    corp_code: "00126380",
    corp_name: "삼성전자",
    added_at: "2024-11-15",
  },
  {
    corp_code: "00164742",
    corp_name: "현대자동차",
    added_at: "2024-11-14",
  },
  {
    corp_code: "00131780",
    corp_name: "중소기업 샘플",
    added_at: "2024-11-13",
  },
];

/**
 * Mock user data for demo
 */
export const MOCK_USER = {
  userId: 1,
  name: "데모 사용자",
  email: "demo@dartlens.com",
};
