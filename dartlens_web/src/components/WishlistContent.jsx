import { useEffect, useRef, useState } from "react";
import { useSelection } from "../context/SelectionContext";
import { useAuth } from "../context/AuthContext";
import { fetchWithMock } from "../services/mockApi";
import { wishlistApi } from "../services/api";

// LocalStorage key for auto-sync preference
const AUTO_SYNC_KEY = "dartlens:autoSync";

// Check if we should use mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export default function WishlistContent({ variant = "panel" }) {
  // Determine container class based on variant
  const containerClass =
    variant === "panel"
      ? "wishlist-content wishlist-content-panel"
      : variant === "page"
      ? "wishlist-content wishlist-content-page"
      : "wishlist-content";

  // Context hooks
  const { selectCorp } = useSelection();
  const { isLoggedIn } = useAuth();

  // Component state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-sync state
  const [autoSync, setAutoSync] = useState(() => {
    try {
      return localStorage.getItem(AUTO_SYNC_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Sync tracking state
  const [syncing, setSyncing] = useState({}); // { [corp_code]: true/false }
  const [syncPhase, setSyncPhase] = useState("대기");

  // Refs for cleanup
  const abortRef = useRef(null);
  const broadcastRef = useRef(null);

  /**
   * Save auto-sync preference to localStorage
   */
  function saveAutoSync(value) {
    setAutoSync(value);
    try {
      localStorage.setItem(AUTO_SYNC_KEY, value ? "1" : "0");
    } catch (error) {
      console.error("Failed to save auto-sync preference:", error);
    }
  }

  /**
   * Load wishlist from API
   */
  async function loadWishlist() {
    if (!isLoggedIn || loading) return;

    setLoading(true);
    setError("");

    // Cancel previous request if still pending
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let data;

      if (USE_MOCK_API) {
        const response = await fetchWithMock("/api/wishlist", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        data = await response.json();
      } else {
        // Use real API
        data = await wishlistApi.getWishlist();
      }

      // Handle different response formats
      const items = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.rows)
        ? data.rows
        : [];

      setRows(items);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("위시리스트 로딩 실패");
        console.error("Wishlist load error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete item from wishlist
   */
  async function handleDelete(corpCode) {
    if (!window.confirm("위시리스트에서 삭제하시겠습니까?")) {
      return;
    }

    try {
      if (USE_MOCK_API) {
        const response = await fetchWithMock(`/api/wishlist/${corpCode}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          // Remove from local state
          setRows((prev) => prev.filter((r) => r.corp_code !== corpCode));
        } else {
          alert("삭제 실패");
        }
      } else {
        // Use real API
        await wishlistApi.removeFromWishlist(corpCode);
        // Remove from local state
        setRows((prev) => prev.filter((r) => r.corp_code !== corpCode));
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("네트워크 오류");
    }
  }

  /**
   * Sync corporation data with DART API
   *
   * Fetches 5 years × 4 report types = 20 total reports
   */
  async function handleSync(corpCode) {
    if (syncing[corpCode]) return;

    setSyncing((prev) => ({ ...prev, [corpCode]: true }));
    setSyncPhase("동기화 중...");

    try {
      const response = await fetch(`/api/insights/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ corp_code: corpCode }),
      });

      const data = await response.json();

      if (data.ok) {
        const addedCount = data.added?.length || 0;
        const foundCount = data.found || 0;
        const expectedCount = data.expected || 20;
        alert(`동기화 완료!\n새로 추가: ${addedCount}건\n전체 데이터: ${foundCount}/${expectedCount}건`);
      } else {
        alert(`동기화 실패: ${data.message || "오류"}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("네트워크 오류");
    } finally {
      setSyncing((prev) => ({ ...prev, [corpCode]: false }));
      setSyncPhase("대기");
    }
  }

  /**
   * Handle item click - select corporation
   */
  function handleSelect(corpCode) {
    selectCorp(corpCode);
  }

  /**
   * Initialize: Load wishlist and setup BroadcastChannel
   */
  useEffect(() => {
    if (isLoggedIn) {
      loadWishlist();

      // Setup BroadcastChannel for cross-tab sync
      try {
        const channel = new BroadcastChannel("dartlens:wishlist");
        broadcastRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data === "reload") {
            loadWishlist();
          }
        };
      } catch (error) {
        console.error("BroadcastChannel not supported:", error);
      }
    }

    // Cleanup
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, [isLoggedIn]);

  /**
   * Listen for auto-sync events
   */
  useEffect(() => {
    const handleAutoSync = (event) => {
      const { corp_code } = event.detail || {};
      if (corp_code && autoSync) {
        handleSync(corp_code);
      }
    };

    window.addEventListener("wishlist:autoSync", handleAutoSync);
    return () => window.removeEventListener("wishlist:autoSync", handleAutoSync);
  }, [autoSync]);

  // Don't render if not logged in
  if (!isLoggedIn) {
    return (
      <div className={containerClass}>
        <div className="wishlist-empty">로그인이 필요합니다.</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Header section */}
      <div className="wishlist-header">
        {variant !== "modal" && <h2 className="wishlist-title">위시리스트</h2>}

        {/* Auto-sync toggle */}
        <div className="wishlist-auto-sync">
          <input
            type="checkbox"
            id="auto-sync"
            checked={autoSync}
            onChange={(e) => saveAutoSync(e.target.checked)}
          />
          <label htmlFor="auto-sync">추가 시 자동 동기화</label>
        </div>

        {/* Status message */}
        <div className="wishlist-status" aria-live="polite">
          {loading ? "로딩 중..." : error ? error : syncPhase}
        </div>
      </div>

      {/* Wishlist items */}
      <div className="wishlist-list-container">
        {rows.length === 0 ? (
          <div className="wishlist-empty">
            {loading ? "로딩 중..." : "위시리스트가 비어 있습니다."}
          </div>
        ) : (
          <ul className="wishlist-list">
            {rows.map((item) => (
              <li
                key={item.corp_code}
                className="wishlist-item"
                onClick={() => handleSelect(item.corp_code)}
              >
                <div className="wishlist-item-info">
                  <div className="wishlist-item-name">
                    {item.alias || item.corp_name}
                  </div>
                  <div className="wishlist-item-code">{item.corp_code}</div>
                </div>

                <div className="wishlist-item-actions">
                  {/* Sync button */}
                  <button
                    className="wishlist-action-btn sync"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(item.corp_code);
                    }}
                    disabled={syncing[item.corp_code]}
                    title="데이터 동기화"
                  >
                    {syncing[item.corp_code] ? "..." : "동기화"}
                  </button>

                  {/* Delete button */}
                  <button
                    className="wishlist-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.corp_code);
                    }}
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
