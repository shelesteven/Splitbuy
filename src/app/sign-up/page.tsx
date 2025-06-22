"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, provider, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { PageContainer } from "@/components/PageContainer";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthUserContext";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignUpPage() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const { authUser, loading } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!loading && authUser) {
      router.replace("/dashboard");
    }
  }, [authUser, loading]);

  const [googleLoading, setGoogleLoading] = useState(false);

  const saveUserToFirestore = async (user: any, name: string) => {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      name: name,
      email: user.email,
      createdAt: new Date().toISOString(),
    });
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const { username, email, password } = data;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await saveUserToFirestore(user, username);

      console.log("Email sign-up successful:", user.email);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Email Sign-Up Error:", error);
      alert("Sign-up failed: " + error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await saveUserToFirestore(user, user.displayName || "No Name");

      console.log("Google sign-in successful:", user.email);
      router.push("/dashboard");
    } catch (error: any) {
      if (error.code !== "auth/cancelled-popup-request") {
        console.error("Google Sign-In Error:", error);
        alert("Google Sign-In failed. See console for details.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <PageContainer className="container mx-auto items-center justify-center">
      <Card className="w-full max-w-md bg-gray-100 dark:bg-gray-900 border-0 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center">Create an Account</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-100 dark:bg-gray-900 px-2 text-gray-400">
              or
            </span>
          </div>
        </div>

        <Button onClick={handleGoogleSignIn} disabled={googleLoading}>
          <FcGoogle size={20} />
          Sign up with Google
        </Button>
      </Card>
    </PageContainer>
  );
}
