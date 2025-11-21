import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Layout and pages
import App from "./App";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Info from "./pages/Info";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Demo from "./pages/Demo";

// Routes and context
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SelectionProvider } from "./context/SelectionContext";

// Styles
import "./index.css";

/**
 * Router Configuration
 *
 * Nested routes structure:
 * - App component provides the main layout (Topbar, Sidebar, WishlistPanel)
 * - Child routes render in the <Outlet /> within App
 * - Auth pages are standalone (no layout)
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public route - Home/Search page
      {
        index: true,
        element: <Home />,
      },

      // Protected route - Dashboard (Monitoring)
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },

      // Protected route - Information page
      {
        path: "info",
        element: (
          <ProtectedRoute>
            <Info />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Standalone auth pages (no layout wrapper)
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },

  // Demo page (standalone - for testing with mock data)
  {
    path: "/demo",
    element: <Demo />,
  },

  // Catch-all route - redirect to home
  {
    path: "*",
    element: <Home />,
  },
]);

/**
 * Render Application
 *
 * Context providers wrap the router:
 * 1. AuthProvider - manages authentication state
 * 2. SelectionProvider - manages selected corporation state
 * 3. RouterProvider - provides routing functionality
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SelectionProvider>
        <RouterProvider router={router} />
      </SelectionProvider>
    </AuthProvider>
  </React.StrictMode>
);
