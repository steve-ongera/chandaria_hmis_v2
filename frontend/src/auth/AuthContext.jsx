import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/endpoints";
import { clearTokens, setTokens } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("hms_user");
    const access = localStorage.getItem("hms_access");
    if (storedUser && access) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const res = await authApi.login(username, password);
    const { access, refresh, user: userData } = res.data;
    setTokens({ access, refresh });
    localStorage.setItem("hms_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  const value = {
    user,
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}