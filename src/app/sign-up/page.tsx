"use client";

import { FcGoogle } from "react-icons/fc"; // Google icon

import { PageContainer } from "@/components/PageContainer";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { Form, FormControl, FormLabel, FormField, FormItem, FormMessage } from "@/components/ui/form";

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

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        console.log("Form submitted:", JSON.stringify(data));
    };

    const handleGoogleSignIn = () => {
        // Placeholder for Google sign-in logic (NextAuth, Firebase, etc.)
        console.log("Google sign-in clicked");
    };

    return (
        <PageContainer className="container mx-auto items-center justify-center">
            <Card className="w-full max-w-md bg-gray-900 border-0 p-8 shadow-xl">
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
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-900 px-2 text-gray-400">or</span>
                    </div>
                </div>

                <Button onClick={handleGoogleSignIn}>
                    <FcGoogle size={20} />
                    Sign Up with Google
                </Button>
            </Card>
        </PageContainer>
    );
}
