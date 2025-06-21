import "./globals.css";

import { ReactNode } from "react";

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthUserProvider } from "@/context/AuthUserContext";

export const metadata: Metadata = {
    title: "Splitbuy | Save More Together",
    description: "Join group buys and save on shipping and bulk products.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col font-sans antialiased overflow-y-scroll">
                <AuthUserProvider>
                    <ThemeProvider attribute="class" enableSystem>
                        <header className="sticky top-0 z-50 w-full bg-background border-b border-neutral-300 dark:border-neutral-800 shadow-xl">
                            <nav className="container mx-auto flex items-center justify-between px-4 py-4">
                                <Link href="/" className="text-2xl font-bold tracking-tight">
                                    Splitbuy
                                </Link>

                                <div className="flex items-center space-x-3">
                                    <Link href="/sign-in">
                                        <Button variant="outline">Sign In</Button>
                                    </Link>
                                    <Link href="/sign-up">
                                        <Button>Sign Up</Button>
                                    </Link>
                                </div>
                            </nav>
                        </header>

                        <main className="grow flex flex-col h-full overflow-auto">{children}</main>

                        <Toaster theme="system" />
                    </ThemeProvider>
                </AuthUserProvider>
            </body>
        </html>
    );
}
