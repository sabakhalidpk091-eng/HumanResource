// App.js
import React from "react";
import LoginPage from "./LoginPage";
import EmployeePortalPage from "./EmployeePortalPage";
import MyDashboardPage from "./MyDashboardPage";
import { useAuth } from "./AuthContext";

function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === "Employee") {
    return <EmployeePortalPage />;
  }

  return <MyDashboardPage />;
}

// Skeleton loading screen that matches the app's dark theme
function LoadingScreen() {
  return (
    <div style={loadingPage}>
      <div style={loadingCard}>
        <div style={shimmer} />
        <div style={{ ...shimmer, width: "60%", marginTop: 12 }} />
        <div style={{ ...shimmer, width: "80%", marginTop: 12 }} />
      </div>
    </div>
  );
}

const loadingPage = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0f1017",
};

const loadingCard = {
  width: 320,
  padding: 32,
  borderRadius: 16,
  background: "#12131c",
  border: "1px solid #232533",
};

const shimmer = {
  height: 16,
  borderRadius: 8,
  background: "linear-gradient(90deg, #1a1b26 25%, #232533 50%, #1a1b26 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.5s infinite",
  width: "100%",
};

export default App;
