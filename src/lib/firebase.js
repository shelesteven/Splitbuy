import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseCredentials = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

Object.keys(firebaseCredentials).forEach((key) => {
    const configValue = firebaseCredentials[key] + "";
    if (configValue.charAt(0) === '"') {
        firebaseCredentials[key] = configValue.substring(1, configValue.length - 1);
    }
});

export const firebaseConfig = firebaseCredentials;

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(firebaseApp);
