"use client";

import * as React from "react";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSignInModalOpen: boolean;
  openSignInModal: () => void;
  closeSignInModal: () => void;
  login: (provider?: "google" | "email") => Promise<void>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "lumora_auth_mock";

const DEFAULT_MOCK_USER: AuthUser = {
  id: "usr_mock_123",
  name: "Loi Tran",
  email: "loitn@lumora.vn",
};

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("lumora_auth_change"));
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("lumora_auth_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("lumora_auth_change", callback);
  };
}

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

const emptySubscribe = () => () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const rawUser = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [isSignInModalOpen, setIsSignInModalOpen] = React.useState(false);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const user: AuthUser | null = React.useMemo(() => {
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }, [rawUser]);

  const login = React.useCallback(async (provider: "google" | "email" = "google") => {
    setIsAuthenticating(true);
    // Simulate brief network authentication
    await new Promise((resolve) => setTimeout(resolve, 300));
    const loggedUser: AuthUser = {
      ...DEFAULT_MOCK_USER,
      name: provider === "google" ? "Loi Tran (Google)" : "Loi Tran",
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      emitAuthChange();
    } catch {
      // Ignore
    } finally {
      setIsAuthenticating(false);
      setIsSignInModalOpen(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      emitAuthChange();
    } catch {
      // Ignore
    }
  }, []);

  const openSignInModal = React.useCallback(() => {
    setIsSignInModalOpen(true);
  }, []);

  const closeSignInModal = React.useCallback(() => {
    setIsSignInModalOpen(false);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: !isHydrated || isAuthenticating,
      isSignInModalOpen,
      openSignInModal,
      closeSignInModal,
      login,
      logout,
    }),
    [user, isHydrated, isAuthenticating, isSignInModalOpen, openSignInModal, closeSignInModal, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
