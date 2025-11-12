// src/components/WishlistPanel.jsx
import WishlistContent from "./WishlistContent.jsx";

export default function WishlistPanel() {
  return (
    <aside className="w-[300px] shrink-0">
      {/* 패널 카드: 세로 플렉스 + 고정 높이 + 내부 스크롤 허용 */}
      <div className="mt-1 rounded-lg border bg-white h-[81vh] flex flex-col min-h-0">
        {/* 내용 영역: 내부 컴포넌트가 스크롤을 가질 수 있도록 래퍼에 min-h-0 */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <WishlistContent variant="panel" />
        </div>
      </div>
    </aside>
  );
}
