"use client";

import { createContext, useContext } from "react";
import useFirebaseAuth from "../lib/useFirebaseAuth";

const authUserContext = createContext({
    authUser: null,
    loading: true,
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
    const auth = useFirebaseAuth();
    return <authUserContext.Provider value={auth}>{children}</authUserContext.Provider>;
}

export const useAuth = () => useContext(authUserContext);
