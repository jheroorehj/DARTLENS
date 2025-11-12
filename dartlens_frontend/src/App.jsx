// src/App.jsx
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Topbar from "./components/Topbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import WishlistPanel from "./components/WishlistPanel.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <Topbar />
      <div className="mx-auto max-w-[1400px] px-4 pb-8">
        <div className="flex gap-1">
          <Sidebar />
          <main className="flex-1 border rounded-lg bg-white overflow-hidden mt-1">
            {/* 고정 높이 래퍼 */}
            <div className="h-[81vh] xl:h-[81vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  className="h-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
          <WishlistPanel />
        </div>
      </div>
    </div>
  );
}
