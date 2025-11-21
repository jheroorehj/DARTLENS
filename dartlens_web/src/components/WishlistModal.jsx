import { useEffect } from "react";
import WishlistContent from "./WishlistContent";

/**
 * @param {object} props
 * @param {function} props.onClose - Callback function to close the modal
 */
export default function WishlistModal({ onClose }) {
  /**
   * Close modal on Escape key press
   */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  /**
   * Handle backdrop click (click outside modal)
   */
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="wishlist-modal-backdrop" onClick={handleBackdropClick}>
      <div className="wishlist-modal">
        {/* Modal header with close button */}
        <div className="wishlist-modal-header">
          <h2 className="wishlist-modal-title">위시리스트</h2>
          <button
            type="button"
            onClick={onClose}
            className="wishlist-modal-close"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Modal content */}
        <div className="wishlist-modal-body">
          <WishlistContent variant="modal" />
        </div>
      </div>
    </div>
  );
}
