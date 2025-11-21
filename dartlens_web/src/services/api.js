import { safeToNumber } from "../utils/numberUtils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

/**
 * Derive risk score when backend does not provide one
 */
function deriveRiskScore(snapshot) {
  const provided = snapshot.kpis?.riskScore ?? snapshot.riskScore ?? snapshot.risk_score ?? snapshot.risk_data?.riskScore;
  if (provided !== null && provided !== undefined) return provided;

  const debtRatio = snapshot.kpis?.debtRatio;
  const currentRatio = snapshot.kpis?.currentRatio;
  const revenueGrowth = snapshot.kpis?.revenueGrowth;
  const operatingMargin = snapshot.kpis?.operatingMargin;

  let score = 85; // 시작점: 보수적 안정 구간

  if (typeof debtRatio === 'number') {
    if (debtRatio > 300) score -= 35;
    else if (debtRatio > 200) score -= 25;
    else if (debtRatio > 150) score -= 15;
    else if (debtRatio < 100) score += 5;
  }

  if (typeof currentRatio === 'number') {
    if (currentRatio < 100) score -= 15;
    else if (currentRatio < 150) score -= 8;
    else if (currentRatio > 200) score += 5;
  }

  if (typeof operatingMargin === 'number' && operatingMargin < 0) {
    score -= 5;
  }

  if (typeof revenueGrowth === 'number' && revenueGrowth < 0) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Derive governance score when backend does not provide one
 */
function deriveGovernanceScore(snapshot) {
  const provided = snapshot.kpis?.governanceScore ?? snapshot.governanceScore ?? snapshot.governance_score ?? snapshot.governance_data?.score;
  if (provided !== null && provided !== undefined) return provided;

  const debtRatio = snapshot.kpis?.debtRatio;
  const revenueGrowth = snapshot.kpis?.revenueGrowth;
  const roe = snapshot.kpis?.roe;
  const dividendPerShare = snapshot.kpis?.dividendPerShare ?? snapshot.dividendPerShare ?? 0;

  let score = 6; // 중립 구간 시작

  if (typeof debtRatio === 'number') {
    if (debtRatio <= 150) score += 1;
    else if (debtRatio > 250) score -= 1;
  }

  if (typeof revenueGrowth === 'number') {
    if (revenueGrowth > 5) score += 0.5;
    else if (revenueGrowth < 0) score -= 0.5;
  }

  if (typeof roe === 'number' && roe > 10) {
    score += 0.5;
  }

  if (dividendPerShare > 0) {
    score += 0.5;
  }

  return Number(Math.min(10, Math.max(0, score)).toFixed(1));
}

/**
 * Fetch wrapper with error handling and authentication
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Send cookies for JWT auth
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`서버 응답 오류: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle backend error responses
    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return {
      ok: true,
      user: response.user,
      token: response.token,
      message: '로그인 성공',
    };
  },

  /**
   * Signup new user
   */
  signup: async (name, email, password) => {
    const response = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    return {
      ok: true,
      user: response.user,
      token: response.token,
      message: '회원가입 성공',
    };
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const response = await apiFetch('/api/auth/me');

    return {
      ok: true,
      user: response.user,
    };
  },

  /**
   * Logout user
   */
  logout: async () => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
    });

    return {
      ok: true,
      message: '로그아웃 성공',
    };
  },
};

/**
 * Wishlist API
 */
export const wishlistApi = {
  /**
   * Get all wishlist items
   */
  getWishlist: async () => {
    const response = await apiFetch('/api/wishlist');

    return {
      ok: true,
      items: response.items || [],
    };
  },

  /**
   * Add corporation to wishlist
   */
  addToWishlist: async (corpCode, corpName) => {
    const response = await apiFetch('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ corp_code: corpCode }),
    });

    return {
      ok: response.ok || true,
      message: '위시리스트에 추가되었습니다.',
    };
  },

  /**
   * Remove corporation from wishlist
   */
  removeFromWishlist: async (corpCode) => {
    await apiFetch(`/api/wishlist/${corpCode}`, {
      method: 'DELETE',
    });

    return {
      ok: true,
      message: '위시리스트에서 제거되었습니다.',
    };
  },
};

/**
 * Insights API (V2.0 with normalization + KPIs)
  */
  export const insightsApi = {
    /**
     * Get corporate insights (V2.0)
   *
   * Uses V2 endpoint with normalization and 9 KPIs
     */
    getInsights: async (corpCode, params = {}) => {
      if (!corpCode) {
        throw new Error('corpCode is required to fetch insights');
      }

      console.log(`[Insights API] Fetching V2 insights for corpCode=${corpCode}`);

    const queryParams = new URLSearchParams({
      years: params.years || 5,
      reprt: params.reprt || 'auto',
      fs: params.fs || 'CFS',
    });

    const response = await apiFetch(`/api/insights/v2/${corpCode}?${queryParams}`);
    const payload = response?.data ?? response;
    const corpIdentifier = payload.corp_code || payload.corpCode || corpCode;

    // Transform backend response to frontend format
    let insights = transformInsightsResponse(payload);

    const timeSeries = Array.isArray(insights.timeSeries) ? insights.timeSeries : [];

    // If backend missed risk/governance scores, trigger non-financial sync (openDART-backed)
    const needsRisk = timeSeries.some((s) => s.kpis?.riskScore === null);
    const needsGovernance = timeSeries.some((s) => s.kpis?.governanceScore === null);

    if ((needsRisk || needsGovernance) && corpIdentifier) {
      try {
        const syncYears = payload.summary?.totalYears || insights.timeSeries.length || 5;
        console.log(`[Insights API] Syncing non-financial data for corpCode=${corpIdentifier}, years=${syncYears}`);
        const synced = await insightsApi.syncNonFinancialData(corpIdentifier, syncYears);
        insights = mergeNonFinancialScores(insights, synced);
      } catch (syncError) {
        console.warn('[Insights API] Non-financial sync skipped:', syncError.message);
      }
    }

    return insights;
  },

  /**
   * Sync non-financial data
   */
  syncNonFinancialData: async (corpCode, years = 5) => {
    const response = await apiFetch('/api/insights/v2/sync/non-financial', {
      method: 'POST',
      body: JSON.stringify({ corp_code: corpCode, years }),
    });

    return response.data;
  },
};

/**
 * Corporation Search API
 */
export const corpsApi = {
  /**
   * Search corporations
   */
  searchCorporations: async (query) => {
    const response = await apiFetch(`/api/corps/search?query=${encodeURIComponent(query)}`);

    return {
      ok: true,
      items: response.items || [],
    };
  },
};

/**
 * Transform V2 backend response to frontend format
 */
function transformInsightsResponse(data) {
  if (!data) {
    throw new Error('Invalid insights data');
  }

  const toNumberOrNull = (value) => safeToNumber(value);

  // Map non-financial scores by year when present in the response
  const riskScoreByYear = new Map();
  const governanceScoreByYear = new Map();

  (data.riskData || data.risk_data || []).forEach((item) => {
    const yearKey = String(item.bsnsYear || item.year || '');
    if (!yearKey) return;
    const numeric = safeToNumber(item.riskScore); // 수정 이유: 비재무 지표도 숫자로 정규화해 연도 매핑 오류 방지
    if (numeric !== null) {
      riskScoreByYear.set(yearKey, numeric);
    }
  });

  (data.governanceData || data.governance_data || []).forEach((item) => {
    const yearKey = String(item.bsnsYear || item.year || '');
    if (!yearKey) return;
    const numeric = safeToNumber(item.governanceScore); // 수정 이유: 문자열 스코어가 정렬을 깨뜨리는 문제 예방
    if (numeric !== null) {
      governanceScoreByYear.set(yearKey, numeric);
    }
  });

  const hasSnapshotShape = Array.isArray(data.snapshots);
  const hasFlatShape = Array.isArray(data.financials) || Array.isArray(data.kpis);

  if (!hasSnapshotShape && !hasFlatShape) {
    throw new Error('Invalid insights data');
  }

  const timeSeries = hasSnapshotShape
    ? data.snapshots.map((snapshot) => ({
        year: snapshot.year,
        reprt_code: snapshot.reprt_code,
        fs_div: snapshot.fs_div,
        rawAccounts: {
          revenue: toNumberOrNull(snapshot.financials?.revenue),
          operatingProfit: toNumberOrNull(snapshot.financials?.operating_profit),
          netIncome: toNumberOrNull(snapshot.financials?.net_income),
          totalAssets: toNumberOrNull(snapshot.financials?.total_assets),
          totalLiabilities: toNumberOrNull(snapshot.financials?.total_liabilities),
          totalEquity: toNumberOrNull(snapshot.financials?.total_equity),
          currentAssets: toNumberOrNull(snapshot.financials?.current_assets),
          currentLiabilities: toNumberOrNull(snapshot.financials?.current_liabilities),
        },
        kpis: {
          roe: toNumberOrNull(snapshot.kpis?.roe),
          debtRatio: toNumberOrNull(snapshot.kpis?.debtRatio),
          currentRatio: toNumberOrNull(snapshot.kpis?.currentRatio),
          operatingMargin: toNumberOrNull(snapshot.kpis?.operatingMargin),
          revenueGrowth: toNumberOrNull(snapshot.kpis?.revenueGrowth),
          eps: toNumberOrNull(snapshot.kpis?.eps),
          riskScore: snapshot.kpis?.riskScore ?? riskScoreByYear.get(String(snapshot.year)) ?? deriveRiskScore(snapshot),
          governanceScore:
            snapshot.kpis?.governanceScore ?? governanceScoreByYear.get(String(snapshot.year)) ?? deriveGovernanceScore(snapshot),
          dividendPerShare: toNumberOrNull(snapshot.kpis?.dividendPerShare),
        },
        metadata: {
          hasFinancialData: snapshot.metadata?.hasFinancialData || false,
          missingFields: snapshot.metadata?.missingFields || [],
          dataSource: 'DART API',
        },
      }))
    : (() => {
        const financialMap = new Map();
        (data.financials || []).forEach((f) => {
          financialMap.set(String(f.year), f);
        });

        const kpiMap = new Map();
        (data.kpis || []).forEach((k) => {
          kpiMap.set(String(k.year), k);
        });

        const allYears = Array.from(new Set([...financialMap.keys(), ...kpiMap.keys()]))
          .filter(Boolean)
          .sort((a, b) => Number(a) - Number(b)); // 수정 이유: 연도 문자열의 사전식 정렬로 KPI/재무 매칭이 틀어지는 사례 방지

        return allYears.map((year) => {
          const financial = financialMap.get(String(year)) || {};
          const kpiRow = kpiMap.get(String(year)) || {};
          const kpis = kpiRow.kpis || kpiRow || {};

          const rawAccounts = {
            revenue: toNumberOrNull(financial.revenue),
            operatingProfit: toNumberOrNull(financial.operating_profit),
            netIncome: toNumberOrNull(financial.net_income),
            totalAssets: toNumberOrNull(financial.total_assets),
            totalLiabilities: toNumberOrNull(financial.total_liabilities),
            totalEquity: toNumberOrNull(financial.total_equity),
            currentAssets: toNumberOrNull(financial.current_assets),
            currentLiabilities: toNumberOrNull(financial.current_liabilities),
          };

          const hasFinancialData = Object.values(rawAccounts).some((v) => v !== null && v !== undefined);

          return {
            year: String(year),
            reprt_code: financial.reprt_code || kpiRow.reprt_code || null,
            fs_div: financial.fs_div || kpiRow.fs_div || data.fs_div || null,
            rawAccounts,
            kpis: {
              roe: toNumberOrNull(kpis.roe),
              debtRatio: toNumberOrNull(kpis.debtRatio),
              currentRatio: toNumberOrNull(kpis.currentRatio),
              operatingMargin: toNumberOrNull(kpis.operatingMargin),
              revenueGrowth: toNumberOrNull(kpis.revenueGrowth),
              eps: toNumberOrNull(kpis.eps),
              riskScore: kpis.riskScore ?? riskScoreByYear.get(String(year)) ?? deriveRiskScore({ kpis, rawAccounts }),
              governanceScore:
                kpis.governanceScore ??
                governanceScoreByYear.get(String(year)) ??
                deriveGovernanceScore({ kpis, rawAccounts }),
              dividendPerShare: toNumberOrNull(kpis.dividendPerShare),
            },
            metadata: {
              hasFinancialData,
              missingFields: [],
              dataSource: 'DART API',
            },
          };
        });
      })();

  const sortedSeries = [...timeSeries].sort((a, b) => Number(a.year) - Number(b.year));
  const latestSnapshot = sortedSeries.length > 0 ? sortedSeries[sortedSeries.length - 1] : null;

  return {
    corpCode: data.corp_code || data.corpCode,
    corpName: data.corp_name || data.corpName,
    corp_name: data.corp_name || data.corpName,
    corp_code: data.corp_code || data.corpCode,
    stockCode: data.stock_code || data.stockCode,
    listed: data.listed,
    timeSeries: sortedSeries,
    summary: latestSnapshot
      ? {
          totalAssets: latestSnapshot.rawAccounts?.totalAssets,
          totalRevenue: latestSnapshot.rawAccounts?.revenue,
          netIncome: latestSnapshot.rawAccounts?.netIncome,
          roe: latestSnapshot.kpis?.roe,
          debtRatio: latestSnapshot.kpis?.debtRatio,
          operatingMargin: latestSnapshot.kpis?.operatingMargin,
          riskScore: latestSnapshot.kpis?.riskScore,
          governanceScore: latestSnapshot.kpis?.governanceScore,
        }
      : null,
    metadata: {
      totalYears: data.summary?.totalYears || sortedSeries.length,
      yearsWithData: data.summary?.yearsWithData || sortedSeries.filter((t) => t.metadata?.hasFinancialData).length,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Merge non-financial scores from sync endpoint back into the insight snapshot
 */
function mergeNonFinancialScores(insights, syncedData) {
  if (!syncedData) return insights;

  const riskByYear = new Map();
  (syncedData.riskData || []).forEach((item) => {
    const yearKey = String(item.bsnsYear || item.year || '');
    if (!yearKey) return;
    if (item.riskScore !== null && item.riskScore !== undefined) {
      riskByYear.set(yearKey, item.riskScore);
    }
  });

  const governanceByYear = new Map();
  (syncedData.governanceData || []).forEach((item) => {
    const yearKey = String(item.bsnsYear || item.year || '');
    if (!yearKey) return;
    if (item.governanceScore !== null && item.governanceScore !== undefined) {
      governanceByYear.set(yearKey, item.governanceScore);
    }
  });

  const updatedSeries = insights.timeSeries.map((entry) => {
    const yearKey = String(entry.year);
    const patchedRisk = entry.kpis?.riskScore ?? riskByYear.get(yearKey) ?? null;
    const patchedGov = entry.kpis?.governanceScore ?? governanceByYear.get(yearKey) ?? null;

    return {
      ...entry,
      kpis: {
        ...entry.kpis,
        riskScore: patchedRisk,
        governanceScore: patchedGov,
      },
    };
  });

  const latestSnapshot = updatedSeries.length > 0 ? updatedSeries[updatedSeries.length - 1] : null;

  return {
    ...insights,
    timeSeries: updatedSeries,
    summary: insights.summary
      ? {
          ...insights.summary,
          riskScore: latestSnapshot?.kpis?.riskScore ?? insights.summary.riskScore ?? null,
          governanceScore: latestSnapshot?.kpis?.governanceScore ?? insights.summary.governanceScore ?? null,
        }
      : insights.summary,
  };
}

/**
 * Unified API object
 */
export const api = {
  auth: authApi,
  wishlist: wishlistApi,
  insights: insightsApi,
  corps: corpsApi,
};

/**
 * Check API status
 */
export async function checkApiStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      ok: response.ok,
      status: data.status,
      version: data.version,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Log API configuration
 */
console.log(
  `%c[API Service] Backend URL: ${API_BASE_URL}`,
  'background: #2196F3; color: white; padding: 4px 8px; border-radius: 3px;'
);

if (USE_MOCK_API) {
  console.log(
    '%c[API Service] WARNING: Mock API is enabled. Set VITE_USE_MOCK_API=false to use real backend.',
    'background: #FF9800; color: white; padding: 4px 8px; border-radius: 3px;'
  );
}

export default api;
