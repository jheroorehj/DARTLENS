import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import WishlistModal from "./WishlistModal";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const [openWishlist, setOpenWishlist] = useState(false);
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();

  /**
   * Close wishlist modal when route changes
   *
   * This ensures the modal doesn't stay open when navigating
   */
  useEffect(() => {
    if (openWishlist) {
      setOpenWishlist(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Logo section */}
        <div className="topbar-logo">
          <Link to="/" aria-label="홈으로 이동">
            <img
              src="/DL_logo.png"
              alt="DART : Lens"
              className="img-interactive"
              style={{ cursor: "pointer" }}
            />
          </Link>
        </div>

        {/* Navigation and auth section */}
        <nav className="topbar-nav">
          {/* Wishlist button (mobile/tablet only) */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setOpenWishlist(true)}
              className="topbar-wishlist-btn"
              aria-label="위시리스트 열기"
              title="위시리스트"
            >
              <img
                src="/wishlist_BTN.png"
                alt="위시리스트"
                className="img-interactive"
              />
            </button>
          )}

          {/* Authentication buttons */}
          {!isLoggedIn ? (
            <>
              {/* Sign up button */}
              <Link to="/signup" className="topbar-auth-btn">
                <img
                  src="/sign%20up_BTN.png"
                  alt="회원가입"
                  className="img-interactive"
                />
              </Link>

              {/* Login button */}
              <Link to="/login" className="topbar-auth-btn">
                <img
                  src="/login_BTN.png"
                  alt="로그인"
                  className="img-interactive"
                />
              </Link>
            </>
          ) : (
            /* Logout button */
            <button
              onClick={logout}
              type="button"
              aria-label="로그아웃"
              title="로그아웃"
              className="topbar-logout-btn"
            >
              <img src="/logout_BTN.png" alt="로그아웃" />
            </button>
          )}
        </nav>
      </div>

      {/* Wishlist modal (opens on mobile/tablet) */}
      {openWishlist && <WishlistModal onClose={() => setOpenWishlist(false)} />}
    </header>
  );
}
