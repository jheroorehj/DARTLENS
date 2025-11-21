import { useNavigate } from "react-router-dom";
import { useSelection } from "../context/SelectionContext";
import { MOCK_COMPANIES } from "../data/mockInsightsData";
import { shouldUseMockApi } from "../services/mockApi";

export default function Demo() {
  const navigate = useNavigate();
  const { selectCorp } = useSelection();

  // Redirect to home if mock API is not enabled
  if (!shouldUseMockApi()) {
    navigate("/");
    return null;
  }

  const handleSelectCompany = (corpCode) => {
    selectCorp(corpCode);
    navigate("/dashboard");
  };

  const companies = [
    {
      corpCode: "00126380",
      corpName: "삼성전자",
      description: "대형 기술주 - 안정적 재무구조",
      highlights: ["ROE 6.74%", "부채비율 31.38%", "5년 평균 성장"],
      color: "blue",
    },
    {
      corpCode: "00164742",
      corpName: "현대자동차",
      description: "대형 자동차 - 변동성 있는 성장",
      highlights: ["ROE 12.92%", "부채비율 201%", "최근 고성장"],
      color: "green",
    },
    {
      corpCode: "00131780",
      corpName: "중소기업 샘플",
      description: "중소기업 - 일부 데이터 누락",
      highlights: ["ROE 3.07%", "부채비율 173%", "N/A 데이터 포함"],
      color: "orange",
    },
  ];

  return (
    <div className="demo-page">
      <div className="demo-container">
        {/* Header */}
        <div className="demo-header">
          <h1 className="demo-title">🎯 DARTLENS V2 데모</h1>
          <p className="demo-subtitle">
            Phase 4 검증 완료된 MVP 데이터로 프론트엔드를 테스트해보세요
          </p>
          <div className="demo-badge">
            <span className="badge-success">Mock API 활성화됨</span>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="demo-cards">
          {companies.map((company) => (
            <div key={company.corpCode} className={`demo-card demo-card-${company.color}`}>
              <div className="demo-card-header">
                <h3 className="demo-card-title">{company.corpName}</h3>
                <span className="demo-card-code">{company.corpCode}</span>
              </div>
              <p className="demo-card-description">{company.description}</p>
              <ul className="demo-card-highlights">
                {company.highlights.map((highlight, idx) => (
                  <li key={idx}>{highlight}</li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectCompany(company.corpCode)}
                className="demo-card-button"
              >
                대시보드에서 보기 →
              </button>
            </div>
          ))}
        </div>

        {/* Features Info */}
        <div className="demo-info">
          <h2 className="demo-info-title">✨ 구현된 기능</h2>
          <div className="demo-info-grid">
            <div className="demo-info-item">
              <div className="demo-info-icon">📊</div>
              <h3>5개 검증된 KPI</h3>
              <p>ROE, 부채비율, 유동비율, 영업이익률, 매출성장률</p>
            </div>
            <div className="demo-info-item">
              <div className="demo-info-icon">📈</div>
              <h3>5년 시계열 데이터</h3>
              <p>2020-2024 연도별 추세 시각화</p>
            </div>
            <div className="demo-info-item">
              <div className="demo-info-icon">🎨</div>
              <h3>색상 코딩</h3>
              <p>지표별 기준에 따른 자동 색상 분류</p>
            </div>
            <div className="demo-info-item">
              <div className="demo-info-icon">⚠️</div>
              <h3>N/A 처리</h3>
              <p>누락 데이터 투명하게 표시</p>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="demo-credentials">
          <h3>🔑 데모 계정</h3>
          <div className="demo-credentials-box">
            <div className="demo-credential">
              <span className="demo-credential-label">이메일:</span>
              <code>demo@dartlens.com</code>
            </div>
            <div className="demo-credential">
              <span className="demo-credential-label">비밀번호:</span>
              <code>demo123</code>
            </div>
          </div>
        </div>

        {/* Toggle Instructions */}
        <div className="demo-toggle">
          <h3>🔧 Mock API 비활성화</h3>
          <p>실제 백엔드와 연결하려면:</p>
          <ol>
            <li>
              <code>.env.development</code> 파일에서{" "}
              <code>VITE_USE_MOCK_API=false</code>로 변경
            </li>
            <li>백엔드 서버를 <code>http://localhost:5001</code>에서 실행</li>
            <li>개발 서버 재시작: <code>npm run dev</code></li>
          </ol>
        </div>
      </div>

      <style>{`
        .demo-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }

        .demo-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .demo-header {
          text-align: center;
          color: white;
          margin-bottom: 60px;
        }

        .demo-title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .demo-subtitle {
          font-size: 20px;
          opacity: 0.9;
          margin-bottom: 20px;
        }

        .demo-badge {
          display: inline-block;
        }

        .badge-success {
          background: #10b981;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .demo-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .demo-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .demo-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .demo-card-blue {
          border-top: 4px solid #3b82f6;
        }

        .demo-card-green {
          border-top: 4px solid #10b981;
        }

        .demo-card-orange {
          border-top: 4px solid #f59e0b;
        }

        .demo-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .demo-card-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
        }

        .demo-card-code {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-family: monospace;
          color: #6b7280;
        }

        .demo-card-description {
          color: #6b7280;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .demo-card-highlights {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }

        .demo-card-highlights li {
          padding: 8px 0;
          color: #374151;
          font-size: 14px;
        }

        .demo-card-highlights li::before {
          content: "✓ ";
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }

        .demo-card-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.3s ease;
        }

        .demo-card-button:hover {
          opacity: 0.9;
        }

        .demo-info {
          background: white;
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 40px;
        }

        .demo-info-title {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 32px;
          text-align: center;
        }

        .demo-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .demo-info-item {
          text-align: center;
        }

        .demo-info-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .demo-info-item h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .demo-info-item p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
        }

        .demo-credentials {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 40px;
        }

        .demo-credentials h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .demo-credentials-box {
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 24px;
        }

        .demo-credential {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .demo-credential:last-child {
          margin-bottom: 0;
        }

        .demo-credential-label {
          font-weight: 600;
          color: #374151;
          min-width: 80px;
        }

        .demo-credential code {
          background: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-family: monospace;
          color: #1f2937;
          border: 1px solid #e5e7eb;
        }

        .demo-toggle {
          background: white;
          border-radius: 16px;
          padding: 32px;
        }

        .demo-toggle h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
        }

        .demo-toggle p {
          color: #6b7280;
          margin-bottom: 16px;
        }

        .demo-toggle ol {
          margin-left: 24px;
          color: #374151;
        }

        .demo-toggle li {
          margin-bottom: 12px;
          line-height: 1.6;
        }

        .demo-toggle code {
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}
