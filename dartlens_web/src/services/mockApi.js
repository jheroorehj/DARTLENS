import {
  MOCK_COMPANIES,
  MOCK_WISHLIST,
  MOCK_USER,
} from "../data/mockInsightsData";

/**
 * Enable/disable mock API
 * Set VITE_USE_MOCK_API=true in .env to enable
 */
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

/**
 * Simulate network delay for realistic testing
 */
const simulateDelay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API endpoints
 */
export const mockApi = {
  /**
   * Check if mock API is enabled
   */
  isEnabled: () => USE_MOCK_API,

  /**
   * Auth - Login
   */
  login: async (email, password) => {
    await simulateDelay(800);

    if (email === "demo@dartlens.com" && password === "demo123") {
      return {
        ok: true,
        user: MOCK_USER,
        token: "mock_jwt_token_12345",
        message: "로그인 성공",
      };
    }

    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  },

  /**
   * Auth - Signup
   */
  signup: async (name, email, password) => {
    await simulateDelay(800);

    return {
      ok: true,
      user: { ...MOCK_USER, name, email },
      token: "mock_jwt_token_12345",
      message: "회원가입 성공",
    };
  },

  /**
   * Auth - Get current user
   */
  getCurrentUser: async () => {
    await simulateDelay(300);

    return {
      ok: true,
      user: MOCK_USER,
    };
  },

  /**
   * Auth - Logout
   */
  logout: async () => {
    await simulateDelay(300);

    return {
      ok: true,
      message: "로그아웃 성공",
    };
  },

  /**
   * Wishlist - Get all
   */
  getWishlist: async () => {
    await simulateDelay(500);

    return {
      ok: true,
      items: MOCK_WISHLIST,
    };
  },

  /**
   * Wishlist - Add corporation
   */
  addToWishlist: async (corpCode, corpName) => {
    await simulateDelay(500);

    return {
      ok: true,
      data: {
        corpCode,
        corpName,
        addedAt: new Date().toISOString().split("T")[0],
      },
      message: "위시리스트에 추가되었습니다.",
    };
  },

  /**
   * Wishlist - Remove corporation
   */
  removeFromWishlist: async (corpCode) => {
    await simulateDelay(500);

    return {
      ok: true,
      message: "위시리스트에서 제거되었습니다.",
    };
  },

  /**
   * Insights - Get corporate insights
   * Returns data directly (not wrapped in {ok, data}) to match backend structure
   */
  getInsights: async (corpCode, params = {}) => {
    await simulateDelay(1000); // Longer delay for complex data

    const insights = MOCK_COMPANIES[corpCode];

    if (!insights) {
      throw new Error("기업 데이터를 찾을 수 없습니다.");
    }

    // Apply year filter if specified
    const years = params.years || 5;
    const filteredTimeSeries = insights.timeSeries.slice(0, years);

    // Return data with both camelCase and snake_case for compatibility
    return {
      ...insights,
      corp_name: insights.corpName, // Add snake_case version
      corp_code: insights.corpCode, // Add snake_case version
      timeSeries: filteredTimeSeries,
    };
  },

  /**
   * Corps - Search corporations
   */
  searchCorporations: async (query) => {
    await simulateDelay(600);

    const allCorps = [
      { corp_code: "00126380", corp_name: "삼성전자", stock_code: "005930" },
      { corp_code: "00164742", corp_name: "현대자동차", stock_code: "005380" },
      { corp_code: "00131780", corp_name: "중소기업 샘플", stock_code: null },
      { corp_code: "00356370", corp_name: "SK하이닉스", stock_code: "000660" },
      { corp_code: "00102485", corp_name: "NAVER", stock_code: "035420" },
      { corp_code: "00114775", corp_name: "카카오", stock_code: "035720" },
    ];

    const filtered = allCorps.filter(
      (corp) =>
        corp.corp_name.includes(query) ||
        corp.corp_code.includes(query) ||
        (corp.stock_code && corp.stock_code.includes(query))
    );

    return {
      ok: true,
      items: filtered,
    };
  },
};

/**
 * Fetch wrapper that can use mock or real API
 */
export const fetchWithMock = async (url, options = {}) => {
  // If mock API is disabled, use real fetch
  if (!USE_MOCK_API) {
    return fetch(url, options);
  }

  // Parse URL and route to mock endpoints
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  const searchParams = Object.fromEntries(urlObj.searchParams);

  try {
    // Auth endpoints
    if (path === "/api/auth/login" && options.method === "POST") {
      const body = JSON.parse(options.body || "{}");
      const data = await mockApi.login(body.email, body.password);
      return createMockResponse(data);
    }

    if (path === "/api/auth/signup" && options.method === "POST") {
      const body = JSON.parse(options.body || "{}");
      const data = await mockApi.signup(body.name, body.email, body.password);
      return createMockResponse(data);
    }

    if (path === "/api/auth/me") {
      const data = await mockApi.getCurrentUser();
      return createMockResponse(data);
    }

    if (path === "/api/auth/logout") {
      const data = await mockApi.logout();
      return createMockResponse(data);
    }

    // Wishlist endpoints
    if (path === "/api/wishlist" && options.method === "GET") {
      const data = await mockApi.getWishlist();
      return createMockResponse(data);
    }

    if (path === "/api/wishlist" && options.method === "POST") {
      const body = JSON.parse(options.body || "{}");
      const data = await mockApi.addToWishlist(body.corpCode, body.corpName);
      return createMockResponse(data);
    }

    if (path.startsWith("/api/wishlist/") && options.method === "DELETE") {
      const corpCode = path.split("/").pop();
      const data = await mockApi.removeFromWishlist(corpCode);
      return createMockResponse(data);
    }

    // Insights endpoints
    if (path.startsWith("/api/insights/")) {
      const corpCode = path.split("/").pop();
      const data = await mockApi.getInsights(corpCode, searchParams);
      return createMockResponse(data);
    }

    // Corps search endpoints
    if (path === "/api/corps/search") {
      const data = await mockApi.searchCorporations(searchParams.query || "");
      return createMockResponse(data);
    }

    // Default: endpoint not mocked
    throw new Error(`Mock endpoint not implemented: ${path}`);
  } catch (error) {
    return createMockResponse(
      {
        ok: false,
        message: error.message,
      },
      400
    );
  }
};

/**
 * Create mock Response object
 */
function createMockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

/**
 * Helper to check if we should use mock data in development
 */
export const shouldUseMockApi = () => {
  return USE_MOCK_API && import.meta.env.DEV;
};

/**
 * Log mock API status
 */
if (USE_MOCK_API) {
  console.log(
    "%c[Mock API] Enabled - Using dummy data",
    "background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px;"
  );
  console.log("Available mock companies:", Object.keys(MOCK_COMPANIES));
  console.log("Demo credentials:", {
    email: "demo@dartlens.com",
    password: "demo123",
  });
}
