"use client";

import { useEffect, useState } from "react"; // ✅ REQUIRED for useState
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
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
  user: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Page() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const { authUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && authUser) {
      router.replace("/dashboard");
    }
  }, [authUser, loading]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user: "",
      password: "",
    },
  });

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
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.user,
        data.password,
      );
      console.log("Email sign-in successful:", userCredential.user.email);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.code === "auth/user-not-found") {
        form.setError("user", { message: "No account found with this email" });
      } else if (error.code === "auth/wrong-password") {
        form.setError("password", { message: "Incorrect password" });
      } else {
        form.setError("user", { message: "Sign-in failed. Try again." });
      }
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
        <h1 className="w-full text-center text-2xl font-bold mb-4">Sign In</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="user"
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-100 dark:bg-gray-900 px-2 text-gray-400">
              or
            </span>
          </div>
        </div>

        <Button onClick={handleGoogleSignIn} disabled={googleLoading}>
          <FcGoogle size={20} />
          Continue with Google
        </Button>
      </Card>
    </PageContainer>
  );
}
