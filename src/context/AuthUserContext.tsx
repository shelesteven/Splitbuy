"use client";

import { createContext, useContext } from "react";
import useFirebaseAuth from "../lib/useFirebaseAuth";

type AuthUser = {
  uid: string;
  email: string;
};

type AuthContextType = {
  authUser: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthUserContext = createContext<AuthContextType>({
  authUser: null,
  loading: true,
  signOut: async () => {},
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  return (
    <AuthUserContext.Provider value={auth}>{children}</AuthUserContext.Provider>
  );
}

export const useAuth = () => useContext(AuthUserContext);

