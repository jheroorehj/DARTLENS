import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelection } from "../context/SelectionContext";
import ExecutiveSummary from "../components/insights/ExecutiveSummary";
import CorrelationCharts from "../components/insights/CorrelationCharts";
import MetricsGrid from "../components/insights/MetricsGrid";
import { fetchWithMock } from "../services/mockApi";
import { insightsApi } from "../services/api";

// Check if we should use mock API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const { selectedCorp, selectCorp } = useSelection();

  /**
   * Sync URL parameter with global selection
   *
   * If ?corp=... is in URL, update global selection state
   */
  const corpFromUrl = useMemo(() => searchParams.get("corp") || "", [searchParams]);

  useEffect(() => {
    if (corpFromUrl && corpFromUrl !== selectedCorp) {
      selectCorp(corpFromUrl);
    }
  }, [corpFromUrl, selectedCorp, selectCorp]);

  // Use selected corporation
  const corpCode = selectedCorp;

  // Insights data state
  const [snapshot, setSnapshot] = useState(null);
  const [corpName, setCorpName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Scroll ref for insights container
  const scrollRef = useRef(null);

  /**
   * Load financial insights from API
   *
   * Fetches 5-year data with automatic report selection (CFS, reprt=auto)
   */
  useEffect(() => {
    if (!corpCode) {
      setSnapshot(null);
      setCorpName("");
      return;
    }

    let isActive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        let data;

        if (USE_MOCK_API) {
          // Use mock API
          const response = await fetchWithMock(
            `/api/insights/${corpCode}?years=5&reprt=auto&fs=CFS`,
            { credentials: "include" }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          data = await response.json();
        } else {
          // Use real API (V2.0 with normalization)
          data = await insightsApi.getInsights(corpCode, {
            years: 5,
            reprt: 'auto',
            fs: 'CFS'
          });
        }

        if (isActive) {
          setSnapshot(data);
          setCorpName(data.corp_name || "");

          // Scroll to top when corporation changes
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        }
      } catch (err) {
        console.error("Insight loading failed:", err);
        if (isActive) {
          setError("인사이트 로딩 실패");
          setSnapshot(null);
          setCorpName("");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    })();

    // Cleanup: prevent state updates after unmount
    return () => {
      isActive = false;
    };
  }, [corpCode]);

  return (
    <div className="dashboard-page">
      <div className="panel-surface dashboard-panel">
        {/* Header */}
        <div className="dashboard-header">
          <h2 className="dashboard-title">MONITORING</h2>
          {corpCode && (
            <span className="dashboard-corp-name">
              {corpName || `기업코드 ${corpCode}`}
            </span>
          )}
        </div>

        {/* Status message */}
        <div className="dashboard-status" aria-live="polite">
          {loading ? "분석 로딩 중..." : error || ""}
        </div>

        {/* Insights display */}
        <div ref={scrollRef} className="dashboard-insights">
          {!corpCode ? (
            <div className="dashboard-empty">
              오른쪽 위시리스트에서 기업을 선택하세요.
            </div>
          ) : snapshot?.timeSeries?.length > 0 ? (
            <>
              {/* Tier 1: Executive Summary (투자 등급 분석) */}
              <ExecutiveSummary kpiHistory={snapshot.timeSeries} />

              {/* Tier 2: Correlation Charts (상관관계 분석 - 우선 표시) */}
              <CorrelationCharts rows={snapshot.timeSeries} />

              {/* Tier 3: Detailed Metrics (상세 지표 - 하단 배치) */}
              <MetricsGrid rows={snapshot.timeSeries} />
            </>
          ) : snapshot?.snapshots?.length > 0 ? (
            /* Legacy structure fallback */
            <>
              <ExecutiveSummary kpiHistory={snapshot.snapshots} />
              <CorrelationCharts rows={snapshot.snapshots} />
              <MetricsGrid rows={snapshot.snapshots} />
            </>
          ) : (
            !loading && (
              <div className="dashboard-empty">
                데이터가 없습니다. 연도/보고서 타입을 확인하세요.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
