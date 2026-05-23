// App.js
import React, { Suspense, lazy } from "react";
import { useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";

// Lazy-load heavy pages — only downloaded when first visited
// This splits the bundle and makes the initial load much faster
const LoginPage = lazy(() => import("./LoginPage"));
const MyDashboardPage = lazy(() => import("./MyDashboardPage"));
const EmployeePortalPage = lazy(() => import("./EmployeePortalPage"));

function AppRoutes() {
  const { user, initializing } = useAuth();

  if (initializing) return <LoadingScreen />;
  if (!user)
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    );
  if (user.role === "Employee")
    return (
      <Suspense fallback={<LoadingScreen />}>
        <EmployeePortalPage />
      </Suspense>
    );
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MyDashboardPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-body)",
      }}
    >
      <div
        style={{
          width: 280,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-strong))",
              flexShrink: 0,
            }}
          />
          <div className="skeleton skeleton-title" style={{ width: 120 }} />
        </div>
        <div className="skeleton skeleton-text" style={{ width: "100%" }} />
        <div className="skeleton skeleton-text" style={{ width: "75%" }} />
        <div className="skeleton skeleton-text" style={{ width: "88%" }} />
        <div className="skeleton skeleton-card" style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}
