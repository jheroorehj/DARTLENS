// src/components/WishlistModal.jsx
import { useEffect, useRef } from "react";
import WishlistContent from "./WishlistContent.jsx";

export default function WishlistModal({ onClose }) {
  const panelRef = useRef(null);

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="mx-auto mt-20 w-[92%] max-w-md rounded-xl border bg-white shadow-lg outline-none"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-base"></h2>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
            onClick={onClose}
            aria-label="Close wishlist"
          >
            X
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <WishlistContent variant="modal" />
        </div>
      </div>
    </div>
  );
}
