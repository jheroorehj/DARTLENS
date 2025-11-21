import { useEffect, useMemo, useRef, useState } from "react";
import { fetchWithMock } from "../services/mockApi";
import { wishlistApi } from "../services/api";

// API base URL from environment or default to empty (proxied)
const API_BASE = import.meta.env.VITE_API_BASE || "";

// Check if we should use mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export default function Home() {
  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Refs for cleanup and DOM access
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const listRef = useRef(null);

  /**
   * Perform search API call
   *
   * This effect runs whenever the query changes, with a 200ms debounce.
   * It automatically cancels previous requests if a new search is initiated.
   */
  useEffect(() => {
    const searchTerm = query.trim();

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset results if query is empty
    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    // Debounce search
    debounceRef.current = setTimeout(async () => {
      // Cancel previous request if still pending
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");

      try {
        const response = await fetchWithMock(
          `${API_BASE}/api/corps/search?query=${encodeURIComponent(searchTerm)}&limit=20`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const corporations = Array.isArray(data.items) ? data.items : Array.isArray(data.rows) ? data.rows : [];

        setResults(corporations);

        // Scroll results to top
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("검색 실패");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  /**
   * Add corporation to wishlist
   */
  async function handleAdd(corporation) {
    try {
      let data;

      if (USE_MOCK_API) {
        const response = await fetchWithMock("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ corp_code: corporation.corp_code }),
        });
        data = await response.json();
      } else {
        // Use real API
        data = await wishlistApi.addToWishlist(corporation.corp_code, corporation.corp_name);
      }

      if (data.ok) {
        alert(`${corporation.corp_name}이(가) 위시리스트에 추가되었습니다.`);

        // Trigger wishlist reload via BroadcastChannel
        try {
          const channel = new BroadcastChannel("dartlens:wishlist");
          channel.postMessage("reload");
          channel.close();
        } catch (error) {
          console.error("BroadcastChannel failed:", error);
        }

        // Trigger auto-sync if enabled
        try {
          const autoSync = localStorage.getItem("dartlens:autoSync") === "1";
          if (autoSync) {
            window.dispatchEvent(
              new CustomEvent("wishlist:autoSync", {
                detail: { corp_code: corporation.corp_code }
              })
            );
          }
        } catch (error) {
          console.error("Auto-sync trigger failed:", error);
        }
      } else {
        alert(`추가 실패: ${data.message || "오류"}`);
      }
    } catch (error) {
      console.error("Add to wishlist error:", error);
      alert("네트워크 오류로 추가하지 못했습니다.");
    }
  }

  // Memoized result count
  const resultCount = useMemo(() => results.length, [results]);

  return (
    <div className="home-page">
      {/* Information section */}
      <section className="home-info">
        <h2 className="home-info-title">DART:Lens 안내</h2>
        <ul className="list-bullet">
          <li>
            검색창에서 원하는 기업을 검색해 선택하면 위시리스트에 추가할 수 있습니다.
          </li>
          <li>
            위시리스트에 추가된 기업은 모니터링 페이지에서 인사이트를 확인할 수 있습니다.
          </li>
        </ul>
      </section>

      {/* Search section */}
      <section className="home-search">
        {/* Search label */}
        <div className="home-search-label">
          <label htmlFor="corp-search" className="home-search-label-text">
            기업 검색
          </label>
          <span className="home-search-hint">
            (기업명 또는 기업코드/종목코드)
          </span>
        </div>

        {/* Search input */}
        <div className="home-search-input-wrapper">
          <input
            id="corp-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: 더존비즈온 또는 00172291"
            className="input-base"
            aria-label="기업 검색"
            autoComplete="off"
          />
        </div>

        {/* Search status */}
        <div className="home-search-status" aria-live="polite">
          {loading
            ? "검색 중..."
            : error
            ? error
            : query.trim() && `결과 ${resultCount}건`}
        </div>

        {/* Search results */}
        <div className="home-results">
          {query.trim() === "" ? (
            <p className="home-results-empty"></p>
          ) : results.length === 0 && !loading && !error ? (
            <p className="home-results-empty">검색 결과가 없습니다.</p>
          ) : (
            results.length > 0 && (
              <div
                ref={listRef}
                className="home-results-list-wrapper"
                tabIndex={0}
                aria-label="검색 결과 목록"
              >
                <ul className="home-results-list">
                  {results.map((corp) => (
                    <li key={corp.corp_code} className="home-result-item">
                      <div className="home-result-info">
                        <span className="home-result-name">
                          {corp.corp_name}
                        </span>
                        <span className="home-result-code">
                          {corp.corp_code}
                        </span>
                      </div>
                      <button
                        className="home-result-add-btn"
                        onClick={() => handleAdd(corp)}
                      >
                        추가
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
