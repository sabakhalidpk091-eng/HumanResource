// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // On app load, try to validate existing token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setInitializing(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user); // { id, username, email, role, linkedEmployeeId }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await api.post("/auth/login", { emailOrUsername, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const register = async (username, email, password, role) => {
    const res = await api.post("/auth/register", {
      username,
      email,
      password,
      role,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    initializing,
    login,
    register,
    logout,
    isAdmin: user?.role === "Admin",
    role: user?.role ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
