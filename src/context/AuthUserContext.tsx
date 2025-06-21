"use client";

import { createContext, useContext, ReactNode } from "react";
import useFirebaseAuth from "../lib/useFirebaseAuth";

interface AuthUser {
    uid: string;
    email: string | null;
}

interface AuthContextType {
    authUser: AuthUser | null;
    loading: boolean;
}

const authUserContext = createContext<AuthContextType>({
    authUser: null,
    loading: true,
});

export function AuthUserProvider({ children }: { children: ReactNode }) {
    const auth = useFirebaseAuth();
    return <authUserContext.Provider value={auth}>{children}</authUserContext.Provider>;
}

export const useAuth = () => useContext(authUserContext);
