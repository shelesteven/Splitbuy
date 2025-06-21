import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged as _onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

const formatAuthUser = (user) => ({
    uid: user.uid,
    email: user.email,
});

export default function useFirebaseAuth() {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const authStateChanged = async (authState) => {
        if (!authState) {
            setAuthUser(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const formattedUser = formatAuthUser(authState);
        setAuthUser(formattedUser);
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = _onAuthStateChanged(auth, authStateChanged);
        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
        setAuthUser(null);
        setLoading(false);
    };

    return {
        authUser,
        loading,
        signOut,
    };
}
