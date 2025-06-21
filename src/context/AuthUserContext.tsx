"use client";

import { createContext, useContext } from "react";
import useFirebaseAuth from "../lib/useFirebaseAuth";

// Add signOut to context type
const authUserContext = createContext({
  authUser: null,
  loading: true,
  signOut: () => {},
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  return <authUserContext.Provider value={auth}>{children}</authUserContext.Provider>;
}

export const useAuth = () => useContext(authUserContext);

