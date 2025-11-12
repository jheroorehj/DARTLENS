// src/pages/Dashboard.jsx
// 변경점:
// - 인사이트 요청 파라미터를 years=5, reprt=auto로 수정
// - 스크롤 컨테이너 유지(overflow-y-auto), 기업 변경 시 맨 위로 이동

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelection } from "../context/SelectionContext.jsx";
import InsightCards from "../components/insights/InsightCards.jsx";

export default function Dashboard() {
  const [sp] = useSearchParams();
  const { selectedCorp, selectCorp } = useSelection();

  // URL의 ?corp= 코드 → 전역 선택 상태에 반영
  const corpFromUrl = useMemo(() => sp.get("corp") || "", [sp]);
  useEffect(() => {
    if (corpFromUrl && corpFromUrl !== selectedCorp) selectCorp(corpFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corpFromUrl]);

  const corp = selectedCorp;

  const [snap, setSnap] = useState(null);
  const [corpName, setCorpName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // 인사이트 리스트 스크롤 영역 참조
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!corp) {
      setSnap(null);
      setCorpName("");
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // 5개년 + 자동 보고서 우선순위(11014>13>12>11), 연결재무(CFS)
        const r = await fetch(`/api/insights/${corp}?years=5&reprt=auto&fs=CFS`, {
          credentials: "include",
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (alive) {
          setSnap(j);
          setCorpName(j.corp_name || "");
          // 기업 변경 시 스크롤 맨 위로
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
        }
      } catch (e) {
        if (alive) {
          setErr("인사이트 로딩 실패");
          setSnap(null);
          setCorpName("");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [corp]);

  return (
    // 부모(App)의 h-[81vh] 높이를 모두 활용. min-h-0로 내부 스크롤 허용.
    <div className="w-full h-full p-4 flex flex-col min-h-0">
      <div className="panel-surface h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">MONITORING</h2>
          {corp && (
            <span className="text-sm text-gray-700 font-medium">
              {corpName || `기업코드 ${corp}`}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 h-5 mt-1" aria-live="polite">
          {loading ? "분석 로딩 중..." : err || ""}
        </div>

        {/* 인사이트 렌더링 영역: 남은 공간을 모두 차지하고 스크롤바 표시 */}
        <div ref={scrollRef} className="mt-2 flex-1 min-h-0 overflow-y-auto">
          {!corp ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-gray-500">
              오른쪽 위시리스트에서 기업을 선택하세요.
            </div>
          ) : snap?.snapshots?.length > 0 ? (
            <InsightCards rows={snap.snapshots} />
          ) : (
            !loading && (
              <div className="rounded-md border border-dashed p-6 text-sm text-gray-500">
                데이터가 없습니다. 연도/보고서 타입을 확인하세요.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
