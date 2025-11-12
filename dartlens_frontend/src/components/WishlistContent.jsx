// src/components/WishlistContent.jsx
// 핵심 변경: 루트에 flex-col min-h-0, 목록 래퍼에 overflow-y-auto 추가
import { useEffect, useRef, useState } from "react";
import { useSelection } from "../context/SelectionContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const AUTO_KEY = "dartlens:autoSync";

export default function WishlistContent({ variant = "panel" }) {
  // 패널일 때는 스크롤을 위해 레이아웃을 플렉스로 강제
  const wrap =
    variant === "panel"
      ? "h-full flex flex-col min-h-0 p-3"
      : variant === "page"
      ? "p-4"
      : "p-3";

  const { selectCorp } = useSelection();
  const { isLoggedIn } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [autoSync, setAutoSync] = useState(() => {
    try { return localStorage.getItem(AUTO_KEY) === "1"; } catch { return false; }
  });
  const [syncing, setSyncing] = useState({});
  const [syncPhase, setSyncPhase] = useState("대기");

  const abortRef = useRef(null);
  const bcRef = useRef(null);

  function saveAutoSync(next) {
    setAutoSync(next);
    try { localStorage.setItem(AUTO_KEY, next ? "1" : "0"); } catch {}
  }

  async function load() {
    if (!isLoggedIn || loading) return;
    setLoading(true); setErr("");

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const r = await fetch("/api/wishlist", {
        credentials: "include",
        signal: ctrl.signal,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const arr = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.rows)
        ? data.rows
        : [];
      setRows(arr);
    } catch (e) {
      if (e.name !== "AbortError") {
        setErr("목록을 불러올 수 없습니다");
        setRows([]);
      }
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }

  async function removeItem(corp_code) {
    setRows((prev) => prev.filter((x) => x.corp_code !== corp_code));
    try {
      await fetch(`/api/wishlist/${corp_code}`, {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      invalidate();
    }
  }

  function invalidate() {
    window.dispatchEvent(new Event("wishlist:invalidate"));
    try { bcRef.current?.postMessage("invalidate"); } catch {}
  }

  async function syncCorp(corp_code) {
    setSyncPhase("진행 중");
    setSyncing((m) => ({ ...m, [corp_code]: true }));
    try {
      const r = await fetch("/api/insights/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ corp_code }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message || `HTTP ${r.status}`);
      if (!autoSync) {
        const added = Array.isArray(data.added) ? data.added.length : 0;
        const remain = Array.isArray(data.missing) ? data.missing.length : 0;
        alert(`동기화 완료: 추가 ${added}건, 미제공 ${remain}건, 확보 ${data.found}/${data.expected}`);
      }
      window.dispatchEvent(new Event("insights:invalidate"));
    } catch (e) {
      if (!autoSync) alert(`동기화 실패: ${e.message || e}`);
    } finally {
      setSyncing((m) => {
        const n = { ...m }; delete n[corp_code]; return n;
      });
      setTimeout(() => {
        const busy = Object.keys(syncing).length > 0;
        setSyncPhase(busy ? "진행 중" : "완료");
      }, 0);
    }
  }

  useEffect(() => {
    const handler = (e) => {
      const { corp_code } = e.detail || {};
      if (!corp_code) return;
      if (autoSync) syncCorp(corp_code);
    };
    window.addEventListener("wishlist:autoSync", handler);
    return () => window.removeEventListener("wishlist:autoSync", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync]);

  useEffect(() => {
    if (!isLoggedIn) {
      abortRef.current?.abort();
      setRows([]); setErr(""); setLoading(false);
      return;
    }
    load();

    try {
      bcRef.current = new BroadcastChannel("wishlist");
      bcRef.current.onmessage = (e) => { if (e.data === "invalidate") load(); };
    } catch {
      bcRef.current = null;
    }

    const onInvalidate = () => load();
    window.addEventListener("wishlist:invalidate", onInvalidate);

    const onFocus = () => load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      abortRef.current?.abort();
      window.removeEventListener("wishlist:invalidate", onInvalidate);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      try { bcRef.current?.close(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className={wrap}>
        <section className="rounded-md border p-3">
          <h3 className="text-sm mb-2">WISH:LIST</h3>
          <p className="text-xs text-gray-500">로그인이 필요한 서비스입니다.</p>
        </section>
      </div>
    );
  }

  const anyBusy = Object.keys(syncing).length > 0;

  return (
    <div className={wrap}>
      {/* 헤더 + 토글 */}
      <div className="flex items-center justify-between">
        <h3 className="text-md">WISH:LIST</h3>
        <div className="flex items-center gap-3">
          <button
            className={`px-2 py-1 text-[11px] rounded border ${
              autoSync ? "bg-green-50 text-green-700 border-green-300" : "hover:bg-gray-50"
            }`}
            onClick={() => saveAutoSync(!autoSync)}
            title="자동 동기화"
          >
            자동 동기화 {autoSync ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* 에러 라인 */}
      <div className="text-xs text-gray-500 h-5">{err}</div>

      {/* 목록: 남은 공간 전부 사용 + 스크롤바 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {autoSync && (
          <div className="text-[11px] text-gray-500 mb-2 px-1">
            {anyBusy
              ? "자동 동기화 진행 중"
              : syncPhase === "완료"
              ? "자동 동기화 완료"
              : "자동 동기화 대기"}
          </div>
        )}
        {rows.length === 0 && !loading ? (
          <p className="text-xs text-gray-500">등록된 기업이 없습니다.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 text-xs text-gray-700 pb-2">
            {rows.map((it) => {
              const busy = !!syncing[it.corp_code];
              return (
                <li key={it.corp_code} className="rounded border p-2 flex items-center justify-between">
                  <button
                    className="text-left"
                    title={it.corp_code}
                    onClick={() => selectCorp(it.corp_code)}
                  >
                    <div className="flex flex-col">
                      <span className="text-gray-900">
                        {it.corp_name ?? it.alias ?? it.corp_code}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {it.corp_code}{it.stock_code ? ` · ${it.stock_code}` : ""}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2">
                    {!autoSync && (
                      <button
                        className="px-2 py-1 text-[11px] rounded border hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                        onClick={() => syncCorp(it.corp_code)}
                        disabled={busy}
                        title="2022~2024, 11011~11014 동기화"
                      >
                        {busy ? "동기화..." : "동기화"}
                      </button>
                    )}
                    <button
                      className="px-2 py-1 text-[11px] rounded border hover:bg-gray-50"
                      onClick={() => removeItem(it.corp_code)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
