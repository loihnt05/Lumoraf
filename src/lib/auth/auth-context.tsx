"use client";

import * as React from "react";
import { loginWithEmail, registerUser, type BackendUserProfile } from "../api/auth";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: "ADMIN" | "MANAGER" | "USER";
  clerkUserId?: string;
  phone?: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSignInModalOpen: boolean;
  openSignInModal: () => void;
  closeSignInModal: () => void;
  login: (emailOrProvider?: string, password?: string) => Promise<void>;
  register: (email: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "lumora_auth_user";
const TOKEN_STORAGE_KEY = "lumora_auth_token";
const LEGACY_STORAGE_KEY = "lumora_auth_mock";

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

function getUserSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
}

function getTokenSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

const emptySubscribe = () => () => {};

function mapBackendUserToAuthUser(u: BackendUserProfile): AuthUser {
  const name =
    u.firstName || u.lastName
      ? `${u.lastName ? u.lastName + " " : ""}${u.firstName ?? ""}`.trim()
      : u.email;
  return {
    id: u.id,
    name,
    email: u.email,
    role: u.role,
    clerkUserId: u.clerkUserId,
    phone: u.phone,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const rawUser = React.useSyncExternalStore(subscribe, getUserSnapshot, getServerSnapshot);
  const rawToken = React.useSyncExternalStore(subscribe, getTokenSnapshot, getServerSnapshot);

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

  const token: string | null = rawToken;

  const login = React.useCallback(async (emailOrProvider: string = "loitn@lumora.vn", password?: string) => {
    setIsAuthenticating(true);
    try {
      let targetEmail = emailOrProvider.trim();
      if (targetEmail === "google" || targetEmail === "email") {
        targetEmail = "loitn@lumora.vn";
      }

      // Call real backend authentication endpoint
      const response = await loginWithEmail(targetEmail, password);
      const authUser = mapBackendUserToAuthUser(response.user);

      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(authUser));
        emitAuthChange();
      }
    } catch (err) {
      // If backend is offline or email not found in mock tests, fallback gracefully
      const fallbackUser: AuthUser = {
        id: "usr_mock_123",
        name: "Loi Tran",
        email: emailOrProvider.includes("@") ? emailOrProvider : "loitn@lumora.vn",
        role: "USER",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallbackUser));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(fallbackUser));
        emitAuthChange();
      }
      throw err;
    } finally {
      setIsAuthenticating(false);
      setIsSignInModalOpen(false);
    }
  }, []);

  const register = React.useCallback(async (email: string, fullName: string, phone?: string) => {
    setIsAuthenticating(true);
    try {
      const response = await registerUser(email, fullName, phone);
      const authUser = mapBackendUserToAuthUser(response.user);

      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(authUser));
        emitAuthChange();
      }
    } finally {
      setIsAuthenticating(false);
      setIsSignInModalOpen(false);
    }
  }, []);

  const logout = React.useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      emitAuthChange();
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
      token,
      isAuthenticated: Boolean(user),
      isLoading: !isHydrated || isAuthenticating,
      isSignInModalOpen,
      openSignInModal,
      closeSignInModal,
      login,
      register,
      logout,
    }),
    [user, token, isHydrated, isAuthenticating, isSignInModalOpen, openSignInModal, closeSignInModal, login, register, logout],
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
