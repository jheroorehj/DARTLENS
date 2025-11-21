import infoData from "../assets/info.json";

export default function Info() {
  /**
   * Helper: Check if value exists and is not null
   */
  const has = (value) => value !== undefined && value !== null;

  /**
   * Helper: Convert to array if not already
   */
  const arr = (value) => (Array.isArray(value) ? value : []);

  return (
    <div className="info-page">
      <div className="panel-surface info-panel">
        {/* Page header */}
        <div className="info-header">
          <h2 className="info-title">정보</h2>
          <div className="info-version">
            v{infoData?.version || "-"} · {infoData?.updated_at || "-"}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="info-content">
          <div className="info-sections">
            {/* Service Overview Section */}
            <section className="card-outline info-section">
              <h3 className="info-section-title">서비스 개요</h3>
              <ul className="list-bullet info-section-content">
                {has(infoData?.overview?.purpose) && (
                  <li>목적: {infoData.overview.purpose}</li>
                )}
                {has(infoData?.overview?.audience) && (
                  <li>대상 사용자: {infoData.overview.audience}</li>
                )}
                {has(infoData?.overview?.scope) && (
                  <>
                    {has(infoData.overview.scope.listing) && (
                      <li>지원 범위: {infoData.overview.scope.listing}</li>
                    )}
                    {has(infoData.overview.scope.years) && (
                      <li>최근 {infoData.overview.scope.years}개년</li>
                    )}
                    {arr(infoData.overview.scope.fs_priority).length > 0 && (
                      <li>
                        연결범위 우선순위:{" "}
                        {infoData.overview.scope.fs_priority.join(" → ")}
                      </li>
                    )}
                    {arr(infoData.overview.scope.reprt_priority).length > 0 && (
                      <li>
                        보고서 우선순위:{" "}
                        {infoData.overview.scope.reprt_priority.join(" → ")}
                      </li>
                    )}
                  </>
                )}
              </ul>
            </section>

            {/* Data Sources Section */}
            <section className="card-outline info-section">
              <h3 className="info-section-title">데이터 소스와 범위</h3>
              <ul className="list-bullet info-section-content">
                {arr(infoData?.data_sources?.opendart?.used_items).length > 0 && (
                  <li>
                    OpenDART 사용 항목:{" "}
                    {infoData.data_sources.opendart.used_items.join(", ")}
                  </li>
                )}
                {arr(infoData?.data_sources?.opendart?.excluded).length > 0 && (
                  <li>
                    비포함: {infoData.data_sources.opendart.excluded.join(", ")}
                  </li>
                )}
                {has(infoData?.data_sources?.opendart?.refresh_policy) && (
                  <>
                    {has(infoData.data_sources.opendart.refresh_policy.manual_sync) && (
                      <li>
                        수동 동기화:{" "}
                        {infoData.data_sources.opendart.refresh_policy.manual_sync}
                      </li>
                    )}
                    {has(infoData.data_sources.opendart.refresh_policy.auto_sync) && (
                      <li>
                        자동 동기화:{" "}
                        {infoData.data_sources.opendart.refresh_policy.auto_sync}
                      </li>
                    )}
                    {has(infoData.data_sources.opendart.refresh_policy.cache_ttl_hours) && (
                      <li>
                        캐시 만료:{" "}
                        {infoData.data_sources.opendart.refresh_policy.cache_ttl_hours}
                        시간
                      </li>
                    )}
                  </>
                )}
              </ul>
            </section>

            {/* Metrics Definitions Section */}
            {arr(infoData?.metrics?.definitions).length > 0 && (
              <section className="card-outline info-section">
                <h3 className="info-section-title">지표 정의와 계산식</h3>
                <ul className="list-bullet info-section-content">
                  {infoData.metrics.definitions.map((metric, index) => (
                    <li key={index}>
                      {metric.name}: {metric.formula}{" "}
                      {metric.unit ? `(${metric.unit})` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Evaluation Criteria Section */}
            {arr(infoData?.metrics?.interpretation).length > 0 && (
              <section className="card-outline info-section">
                <h3 className="info-section-title">평가 기준</h3>
                <ul className="list-bullet info-section-content">
                  {infoData.metrics.interpretation.map((item, index) => (
                    <li key={index}>
                      <div className="info-subsection-title">
                        {item.metric}
                        {arr(item.ranges).length > 0 && (
                          <span className="info-metric-ranges">
                            {" ("}
                            {item.ranges.map((range, idx) => (
                              <span
                                key={idx}
                                className={`info-metric-range ${range.className}`}
                              >
                                {range.text}
                              </span>
                            ))}
                            {")"}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Interpretation Flow Section */}
            <section className="card-outline info-section">
              <h3 className="info-section-title">해석 흐름</h3>
              <p className="info-flow">
                매출 증가 → 이익률 개선 → 유보율 확대 → 부채 축소 → 재무 안정성
                상승
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
