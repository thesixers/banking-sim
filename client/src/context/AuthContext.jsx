import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAccount = useCallback(async () => {
    try {
      const res = await api.auth.me();
      setUser(res.user);
      setAccount(res.account);
    } catch {
      // Session expired
      logout();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("nova_token");
    if (token) {
      refreshAccount().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await api.auth.login(credentials);
    setToken(res.token);
    setUser(res.user);
    setAccount(res.account);
    return res;
  };

  const register = async (details) => {
    const res = await api.auth.register(details);
    setToken(res.token);
    setUser(res.user);
    setAccount(res.account);
    return res;
  };

  /**
   * Submit the 6-digit OTP to verify the user's email address.
   * On success, refreshes the user object so email_verified becomes true.
   */
  const verifyEmail = async (otp_code) => {
    const res = await api.auth.verifyEmail({ otp_code });
    // Refresh user to get updated email_verified flag
    await refreshAccount();
    return res;
  };

  /**
   * Ask the server to send a fresh OTP to the user's email.
   */
  const resendVerification = async () => {
    return api.auth.resendVerification();
  };

  /**
   * Reactivate a dormant unverified account using email + OTP code.
   */
  const reactivateDormant = async ({ email, otp_code }) => {
    const res = await api.auth.reactivateDormant({ email, otp_code });
    setToken(res.token);
    setUser(res.user);
    setAccount(res.account);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        reactivateDormant,
        logout,
        refreshAccount,
        setAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
