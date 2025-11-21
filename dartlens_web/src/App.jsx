import { Outlet, useLocation } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import WishlistPanel from "./components/WishlistPanel";

export default function App() {
  const location = useLocation();

  return (
    <div className="app-root">
      {/* Header with logo and auth buttons */}
      <Topbar />

      {/* Main content container */}
      <div className="app-container">
        <div className="app-layout">
          {/* Left sidebar navigation */}
          <Sidebar />

          {/* Main content area with route outlet */}
          <main className="app-main">
            <div className="app-main-inner">
              {/* AnimatePresence enables exit animations for page transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  className="page-transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut"
                  }}
                >
                  {/* Current page component rendered here */}
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Right sidebar wishlist (desktop only) */}
          <WishlistPanel />
        </div>
      </div>
    </div>
  );
}
