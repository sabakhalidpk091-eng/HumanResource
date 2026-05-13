// App.js
import React from "react";
import LoginPage from "./LoginPage";
import EmployeePortalPage from "./EmployeePortalPage";
import MyDashboardPage from "./MyDashboardPage";
import { useAuth } from "./AuthContext";

function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  // EMPLOYEE -> employee portal (small sidebar: My dashboard, My tasks, My leave...)
  if (user.role === "Employee") {
    return <EmployeePortalPage />;
  }
  
  // ADMIN / HR / PM -> admin dashboard (the big sidebar you pasted)
  return <MyDashboardPage />;
}

export default App;
