"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

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
        <section className="flex grow items-center justify-center bg-gradient-to-br from-indigo-200 to-white dark:from-indigo-950/40 dark:to-gray-950 px-6 py-16 overflow-hidden">
            <div className="mx-auto flex flex-col items-center justify-between z-10">
                <div className="text-center max-w-2xl">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-500 dark:text-indigo-400 leading-tight mb-2">Group up. Save big.</h1>
                    <p className="text-lg md:text-2xl text-gray-800 dark:text-gray-200 mb-8">Discover smarter shopping. Create or join a group buy to save money on bulk items and shipping.</p>
                </div>

                <Card className="w-full max-w-md bg-background/80 p-8 shadow-xl">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((data) => toast.success(JSON.stringify(data)))} className="space-y-6">
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
        </section>
    );
}
