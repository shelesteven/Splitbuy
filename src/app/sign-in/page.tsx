"use client";

import { PageContainer } from "@/components/PageContainer";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { Form, FormControl, FormLabel, FormField, FormItem, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
    user: z
        .string()
        .min(1, "Username or email is required")
        .email("Invalid email format")
        .or(z.string().regex(/^[a-zA-Z0-9_]+$/, "Invalid username format")),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Page() {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            user: "",
            password: "",
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        console.log("Form submitted:", JSON.stringify(data));
    };

    return (
        <PageContainer className="container mx-auto items-center justify-center">
            <Card className="w-full max-w-md bg-gray-900 border-0 p-8 shadow-xl">
                <h1 className="w-full text-center text-2xl font-bold">Sign In</h1>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="user"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username or Email</FormLabel>
                                    <FormControl>
                                        <Input type="user" {...field} />
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
            </Card>
        </PageContainer>
    );
}
