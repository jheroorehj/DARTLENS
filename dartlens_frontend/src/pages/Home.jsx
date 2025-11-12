// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function Home() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const s = q.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!s) {
      setRows([]);
      setLoading(false);
      setErr("");
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setLoading(true);
      setErr("");
      try {
        const r = await fetch(
          `${API_BASE}/api/corps/search?q=${encodeURIComponent(s)}&limit=20`,
          { signal: ac.signal }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const next = Array.isArray(data.rows) ? data.rows : [];
        setRows(next);
        if (listRef.current) listRef.current.scrollTop = 0;
      } catch (e) {
        if (e.name !== "AbortError") setErr("검색 실패");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const resultCount = useMemo(() => rows.length, [rows]);

  return (
    // 부모 높이 전부 사용 + 세로 플렉스. min-h-0로 자식이 축소 가능
    <div className="h-full w-full p-4 space-y-4 flex flex-col min-h-0">
      <section className="card-surface-lg">
        <h2 className="text-lg font-medium mb-2">DART:Lens 안내</h2>
        <ul className="list-bullet">
          <li>검색창에서 원하는 기업을 검색해 선택하면 위시리스트에 추가할 수 있습니다.</li>
          <li>위시리스트에 추가된 기업은 모니터링 페이지에서 인사이트를 확인할 수 있습니다.</li>
        </ul>
      </section>

      {/* 검색 섹션: 내부에 결과 스크롤 영역을 갖는 컬럼 */}
      <section className="card-surface-lg flex flex-col min-h-0">
        <div className="flex items-center gap-2">
          <label htmlFor="corp-search" className="text-sm text-gray-600">
            기업 검색
          </label>
          <span className="text-xs text-gray-400">(기업명 또는 기업코드/종목코드)</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            id="corp-search"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: 더존비즈온 또는 00172291"
            className="input-base focus:ring-blue-200"
            aria-label="기업 검색"
            autoComplete="off"
          />
        </div>

        <div className="mt-2 h-5 text-xs text-gray-500" aria-live="polite">
          {loading ? "검색 중..." : err ? err : q.trim() && `결과 ${resultCount}건`}
        </div>

        {/* 남은 공간 전부를 결과에 할당. 내부 스크롤 */}
        <div className="mt-2 flex-1 min-h-0">
          {q.trim() === "" ? (
            <p className="text-sm text-gray-500"></p>
          ) : rows.length === 0 && !loading && !err ? (
            <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
          ) : (
            rows.length > 0 && (
              <div
                ref={listRef}
                className="h-full overflow-y-auto rounded-md border"
                tabIndex={0}
                aria-label="검색 결과 목록"
              >
                <ul className="divide-y">
                  {rows.map((c) => (
                    <li
                      key={c.corp_code}
                      className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                      title={c.corp_code}
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-900">{c.corp_name}</span>
                        <span className="text-xs text-gray-500">{c.corp_code}</span>
                      </div>
                      <button
                        className="text-xs px-2 py-1 border rounded hover:bg-blue-50 text-blue-600"
                        onClick={async () => {
                          try {
                            const r = await fetch("/api/wishlist", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ corp_code: c.corp_code }),
                            });
                            const data = await r.json();
                            if (data.ok) {
                              alert(`${c.corp_name}이(가) 위시리스트에 추가되었습니다.`);

                              // 자동 동기화: localStorage 토글 확인 후 트리거
                              try {
                                const auto = localStorage.getItem("dartlens:autoSync") === "1";
                                if (auto) {
                                  window.dispatchEvent(
                                    new CustomEvent("wishlist:autoSync", { detail: { corp_code: c.corp_code } })
                                  );
                                }
                              } catch {}
                            } else {
                              alert(`추가 실패: ${data.message || "오류"}`);
                            }
                          } catch {
                            alert("네트워크 오류로 추가하지 못했습니다.");
                          }
                        }}
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
