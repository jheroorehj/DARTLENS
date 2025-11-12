// src/pages/Info.jsx
// 목적: src/assets/info.json을 로드해 정보 페이지를 렌더링
// 주의: Vite/ESM에서는 src 아래 JSON을 모듈로 임포트 가능
import info from "../assets/info.json";

export default function Info() {
  // 안전 접근 헬퍼
  const has = (v) => v !== undefined && v !== null;
  const arr = (v) => (Array.isArray(v) ? v : []);

  return (
    <div className="w-full h-full p-4">
      <div className="h-full panel-surface">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">정보</h2>
          <div className="text-xs text-gray-500">
            v{info?.version || "-"} · {info?.updated_at || "-"}
          </div>
        </div>

        {/* 스크롤 컨테이너 */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1">

          {/* 서비스 개요 */}
          <section className="card-outline">
            <h3 className="text-base font-medium mb-2">서비스 개요</h3>
            <ul className="list-bullet">
              {has(info?.overview?.purpose) && <li>목적: {info.overview.purpose}</li>}
              {has(info?.overview?.audience) && <li>대상 사용자: {info.overview.audience}</li>}
              {has(info?.overview?.scope) && (
                <>
                  {has(info.overview.scope.listing) && <li>지원 범위: {info.overview.scope.listing}</li>}
                  {has(info.overview.scope.years) && <li>최근 {info.overview.scope.years}개년</li>}
                  {arr(info.overview.scope.fs_priority).length > 0 && (
                    <li>연결범위 우선순위: {info.overview.scope.fs_priority.join(" → ")}</li>
                  )}
                  {arr(info.overview.scope.reprt_priority).length > 0 && (
                    <li>보고서 우선순위: {info.overview.scope.reprt_priority.join(" → ")}</li>
                  )}
                </>
              )}
            </ul>
          </section>

          {/* 데이터 소스와 범위 */}
          <section className="card-outline">
            <h3 className="text-base font-medium mb-2">데이터 소스와 범위</h3>
            <ul className="list-bullet">
              {arr(info?.data_sources?.opendart?.used_items).length > 0 && (
                <li>OpenDART 사용 항목: {info.data_sources.opendart.used_items.join(", ")}</li>
              )}
              {arr(info?.data_sources?.opendart?.excluded).length > 0 && (
                <li>비포함: {info.data_sources.opendart.excluded.join(", ")}</li>
              )}
              {has(info?.data_sources?.opendart?.refresh_policy) && (
                <>
                  {has(info.data_sources.opendart.refresh_policy.manual_sync) && (
                    <li>수동 동기화: {info.data_sources.opendart.refresh_policy.manual_sync}</li>
                  )}
                  {has(info.data_sources.opendart.refresh_policy.auto_sync) && (
                    <li>자동 동기화: {info.data_sources.opendart.refresh_policy.auto_sync}</li>
                  )}
                  {has(info.data_sources.opendart.refresh_policy.cache_ttl_hours) && (
                    <li>캐시 만료: {info.data_sources.opendart.refresh_policy.cache_ttl_hours}시간</li>
                  )}
                </>
              )}
            </ul>
          </section>

          {/* 지표 정의와 계산식 */}
          {arr(info?.metrics?.definitions).length > 0 && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">지표 정의와 계산식</h3>
              <ul className="list-bullet">
                {info.metrics.definitions.map((d, i) => (
                  <li key={i}>
                    {d.name}: {d.formula} {d.unit ? `(${d.unit})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 기준 임계치 */}
          {has(info?.metrics?.thresholds) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">해석 기준표</h3>
              <ul className="list-bullet">
                {Object.entries(info.metrics.thresholds).map(([k, v]) => (
                  <li key={k}>
                    {k}: {Object.entries(v).map(([kk, vv]) => `${kk} ${vv}`).join(", ")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 보고서·연결범위 우선순위 */}
          {has(info?.report_priority) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">보고서·연결범위 우선순위</h3>
              <ul className="list-bullet">
                {arr(info.report_priority.reprt_code).length > 0 && (
                  <li>reprt_code: {info.report_priority.reprt_code.join(" → ")}</li>
                )}
                {arr(info.report_priority.fs_div).length > 0 && (
                  <li>fs_div: {info.report_priority.fs_div.join(" → ")}</li>
                )}
              </ul>
            </section>
          )}

          {/* 결측치·예외 처리 */}
          {has(info?.missing_value_policy) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">결측치·예외 처리</h3>
              <ul className="list-bullet">
                {Object.entries(info.missing_value_policy).map(([k, v]) => (
                  <li key={k}>
                    {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 해석 규칙 */}
          {has(info?.interpretation) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">해석 흐름·컬러 규칙</h3>
              <ul className="list-bullet">
                {has(info.interpretation.flow) && <li>흐름: {info.interpretation.flow}</li>}
                {has(info.interpretation.color_rules) && (
                  <li>
                    컬러:{" "}
                    {Object.entries(info.interpretation.color_rules)
                      .map(([k, v]) => `${k}:${v}`)
                      .join(", ")}
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* 동기화 정책 */}
          {has(info?.sync_policy) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">동기화 정책</h3>
              <ul className="list-bullet">
                {has(info.sync_policy.auto?.behavior) && <li>자동: {info.sync_policy.auto.behavior}</li>}
                {has(info.sync_policy.manual?.action) && <li>수동: {info.sync_policy.manual.action}</li>}
                {has(info.sync_policy.retry) && (
                  <li>
                    재시도: {info.sync_policy.retry.max_attempts}회, {info.sync_policy.retry.backoff_seconds}초 간격
                  </li>
                )}
                {has(info.sync_policy.logging) && <li>로그: {info.sync_policy.logging.collect?.join(", ")}</li>}
              </ul>
            </section>
          )}

          {/* 한계와 면책 */}
          {arr(info?.limitations).length > 0 && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">한계와 면책</h3>
              <ul className="list-bullet">
                {info.limitations.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 개인정보 및 보안 */}
          {has(info?.privacy) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">개인정보 및 보안</h3>
              <ul className="list-bullet">
                {Object.entries(info.privacy).map(([k, v]) => (
                  <li key={k}>
                    {k}: {String(v)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 변경 이력 */}
          {arr(info?.changelog).length > 0 && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">버전·변경 이력</h3>
              <ul className="list-bullet">
                {info.changelog.map((c, i) => (
                  <li key={i}>
                    {c.date}: {arr(c.changes).join(", ")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 로드맵 */}
          {arr(info?.roadmap).length > 0 && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">로드맵</h3>
              <ul className="list-bullet">
                {info.roadmap.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 문의 채널 */}
          {has(info?.contact) && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">문의 채널</h3>
              <ul className="list-bullet">
                {has(info.contact.email) && <li>이메일: {info.contact.email}</li>}
                {has(info.contact.github) && <li>깃허브: {info.contact.github}</li>}
                {has(info.contact.slack) && <li>슬랙: {info.contact.slack}</li>}
              </ul>
            </section>
          )}

          {/* 출처 고지 */}
          {arr(info?.notices).length > 0 && (
            <section className="card-outline">
              <h3 className="text-base font-medium mb-2">라이선스·출처 고지</h3>
              <ul className="list-bullet">
                {info.notices.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
