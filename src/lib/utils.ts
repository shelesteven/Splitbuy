import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const saveUserToFirestore = async (user: any, username: string) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    name: username,
    email: user.email,
    createdAt: new Date().toISOString(),
  });
};


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

