/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authService } from "../services/authServices";
import type { UserInfo } from "../services/authServices";

interface AuthContextType {
  user: UserInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a callback with code
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has("code");

    const initAuth = async () => {
      try {
        if (hasCode) {
          // Handle OAuth callback
          const userInfo = await authService.handleCallback();
          setUser(userInfo);
        } else if (authService.isAuthenticated()) {
          // Get current user if already authenticated
          const userInfo = await authService.getCurrentUser();
          setUser(userInfo);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    await authService.login();
  };

  const logout = async () => {
    setUser(null);
    await authService.logout();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
