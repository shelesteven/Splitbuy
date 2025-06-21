"use client";

import { useState } from "react";
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

const formSchema = z.object({
  user: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Page() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

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
        data.password
      );
      console.log("Email sign-in successful:", userCredential.user.email);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.code === "auth/user-not-found") {
        form.setError("user", {
          message: "No account found with this email",
        });
      } else if (error.code === "auth/wrong-password") {
        form.setError("password", {
          message: "Incorrect password",
        });
      } else {
        form.setError("user", {
          message: "Sign-in failed. Try again.",
        });
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
    <PageContainer className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a0033] to-[#10002b] text-white">
      <Card className="w-full max-w-md rounded-2xl border border-purple-700 bg-gradient-to-br from-purple-800/80 to-pink-900/80 p-8 shadow-2xl text-white">
        <h1 className="w-full text-center text-2xl font-bold mb-4">Sign In</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="text-black" />
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
                  <FormLabel className="text-white">Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="text-black" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200">
              Continue
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-500" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-transparent px-2 text-gray-300">or</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full bg-white text-black hover:bg-gray-200 font-medium flex items-center justify-center gap-2"
        >
          <FcGoogle size={20} />
          Continue with Google
        </Button>
      </Card>
    </PageContainer>
  );
}
