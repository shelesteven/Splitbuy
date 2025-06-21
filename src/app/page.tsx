"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

import { PageContainer } from "@/components/PageContainer";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { toast } from "sonner";

const formSchema = z.object({
    email: z.string().email(),
});

export default function Home() {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    return (
        <PageContainer className="items-center justify-center bg-gradient-to-br from-indigo-200 to-white dark:from-indigo-950/40 dark:to-gray-950">
            <div className="flex flex-col md:flex-row items-center justify-center min-w-full md:gap-16 z-10">
                <div className="text-center md:text-left max-w-6xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-indigo-500 dark:text-indigo-400 leading-tight mb-2">Group up. Save big.</h1>
                    <p className="max-w-full md:max-w-2xl text-md md:text-xl text-gray-800 dark:text-gray-200 mb-8">Discover smarter shopping. Create or join a group buy to save money on bulk items and shipping.</p>
                </div>

                <Card className="w-full max-w-md bg-gray-900 border-0 p-8 shadow-xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => toast.success(JSON.stringify(data)))} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input type="email" placeholder="you@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                Get Started
                            </Button>
                        </form>
                    </Form>
                </Card>
            </div>
        </PageContainer>
    );
}
