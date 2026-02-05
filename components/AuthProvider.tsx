"use client";

import { UserData } from "@/lib/types/userType";
import { createContext, useContext, useEffect, useState } from "react";

export enum AuthStatus {
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

type AuthState = {
  status: AuthStatus;
  userData: UserData | null;
};

type AuthStateExtended = AuthState & {
  refreshAuth: () => void;
};

const authContext = createContext<AuthStateExtended>({ status: AuthStatus.Loading, userData: null, refreshAuth: () => {} });

export function AuthProvider({ children, loggedInUser }: { children: React.ReactNode; loggedInUser?: UserData | null }) {
  const [authState, setAuthState] = useState<AuthState>(
    loggedInUser ? { status: AuthStatus.Authenticated, userData: loggedInUser } : { status: AuthStatus.Loading, userData: null },
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAuth = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (loggedInUser && refreshKey === 0) return;
      try {
        setAuthState({ status: AuthStatus.Loading, userData: null });
        const response = await fetch("/api/whoami", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.status !== 200) {
          if (!cancelled) setAuthState({ status: AuthStatus.Unauthenticated, userData: null });
          return;
        }
        const userData: UserData = await response.json();
        if (!cancelled) setAuthState({ status: AuthStatus.Authenticated, userData });
      } catch (error) {
        if (!cancelled) setAuthState({ status: AuthStatus.Unauthenticated, userData: null });
        console.error("Error fetching authenticated user data:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loggedInUser, refreshKey]);

  return <authContext.Provider value={{ ...authState, refreshAuth }}>{children}</authContext.Provider>;
}

/**
 * Custom hook to access authentication state and user data.
 *
 * @returns User data or null and authentication status.
 * @throws Will throw an error if used outside of AuthProvider.
 */
export const useAuth = () => {
  return useContext(authContext);
};
