import { useState, useEffect } from "react";
import { auth } from "./firebase";

import { onAuthStateChanged as _onAuthStateChanged } from "firebase/auth";

const formatAuthUser = (user) => ({
    uid: user.uid,
    email: user.email,
});

export default function useFirebaseAuth() {
    const [authUser, setAuthUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const authStateChanged = async (authState) => {
        if (!authState) {
            setLoading(false);
            return;
        }

        setLoading(true);

        var formattedUser = formatAuthUser(authState);

        setAuthUser(formattedUser);

        setLoading(false);
    };

    const onAuthStateChanged = (cb) => {
        return _onAuthStateChanged(auth, cb);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(authStateChanged);
        return () => unsubscribe();
    }, []);

    return {
        authUser,
        loading,
    };
}
