// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Info from "./pages/Info.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SelectionProvider } from "./context/SelectionContext.jsx";
import "./index.css";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // 공개 라우트 (홈만 접근 가능)
      { index: true, element: <Home /> },

      // 보호 라우트
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
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
  // 인증 페이지는 예외로 공개
  { path: "/signup", element: <Signup /> },
  { path: "/login", element: <Login /> },

  // 없는 경로 접근 시 홈으로
  { path: "*", element: <Home /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SelectionProvider>
        <RouterProvider router={router} />
      </SelectionProvider>
    </AuthProvider>
  </React.StrictMode>
);
