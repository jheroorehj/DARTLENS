// src/components/Topbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import WishlistModal from "./WishlistModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Topbar() {
  const [openWishlist, setOpenWishlist] = useState(false);
  const loc = useLocation();
  const { isLoggedIn, login, logout } = useAuth(); // login 추가

  useEffect(() => {
    if (openWishlist) setOpenWishlist(false);
  }, [loc.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto max-w-[1400px] h-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-4">
          <Link to="/" aria-label="Go home">
            <img
            src="/DL_logo.png"
            alt="DART : Lens"
            className="h-12 w-auto img-interactive cursor-pointer" />
          </Link>
        </div>

        <nav className="flex items-center gap-3 mr-4">
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setOpenWishlist(true)}
              className="inline-block xl:hidden"
              aria-label="Open wishlist"
              title="Open wishlist"
            >
              <img
              src="/wishlist_BTN.png"
              alt="Wishlist"
              className="h-9 w-auto img-interactive" />
            </button>
          )}
          
          {!isLoggedIn ? (
            <>
              <Link to="/signup">
                <img
                src={"/sign%20up_BTN.png"}
                alt="Sign up"
                className="h-9 w-auto img-interactive" />
              </Link>

              <Link to="/login">
                <img 
                src={"/login_BTN.png"} 
                alt="Login" 
                className="h-9 w-auto transition-transform duration-150 hover:scale-110 active:scale-100 hover:brightness-110" />
              </Link>
            </>
          ) : (
            <button
              onClick={logout}
              type="button"
              aria-label="Logout"
              title="Logout"
              className="inline-block transition-transform duration-150 hover:scale-95 active:scale-90 hover:brightness-110"
            >
              
              <img 
              src="/logout_BTN.png" 
              alt="Logout" 
              className="h-6 w-auto" 
              />

            </button>
          )}
        </nav>
      </div>

      {openWishlist && <WishlistModal onClose={() => setOpenWishlist(false)} />}
    </header>
  );
}
