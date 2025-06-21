"use client";

import { useState } from "react"; // ✅ REQUIRED for useState
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
import { Form, FormControl, FormLabel, FormField, FormItem, FormMessage } from "@/components/ui/form";

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
            const userCredential = await signInWithEmailAndPassword(auth, data.user, data.password);
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
                <h1 className="w-full text-center text-2xl font-bold text-white mb-4">Sign In</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="user"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} className="bg-gray-800 text-white" />
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
                                        <Input type="password" {...field} className="bg-gray-800 text-white" />
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

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-900 px-2 text-gray-400">or</span>
                    </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className={`w-full flex items-center justify-center gap-3 py-2 rounded-lg transition ${googleLoading ? "bg-gray-400 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200"}`}>
                    <FcGoogle size={20} />
                    {googleLoading ? "Signing in..." : "Continue with Google"}
                </button>
            </Card>
        </PageContainer>
    );
}
