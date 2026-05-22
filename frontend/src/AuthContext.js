// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

function resolveTheme(theme) {
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme) {
  if (typeof window !== "undefined") {
    document.documentElement.dataset.theme = resolveTheme(theme);
  }
}

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
        const currentUser = res.data.user;
        setUser(currentUser);
        applyTheme(currentUser.theme);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
        applyTheme("system");
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = async (emailOrUsername, password) => {
    const res = await api.post("/auth/login", { emailOrUsername, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    applyTheme(res.data.user.theme);
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
    applyTheme(res.data.user.theme);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    applyTheme(nextUser?.theme);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    applyTheme("system");
  };

  const value = {
    user,
    initializing,
    login,
    register,
    updateUser,
    logout,
    isAdmin: user?.role === "Admin",
    role: user?.role ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
