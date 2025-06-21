import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
    title: "Splitbuy | Save More Together",
    description: "Join group buys and save on shipping and bulk products.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen font-sans antialiased">
                <ThemeProvider attribute="class" forcedTheme="dark">
                    <header className="fixed top-0 z-50 w-full bg-background/30 backdrop-blur-md border-b border-indigo-400/40 dark:border-indigo-900/40 shadow-lg">
                        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
                            <Link href="/" className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 tracking-tight">
                                Splitbuy
                            </Link>

                            <div className="flex items-center space-x-3">
                                <Link href="/sign-in">
                                    <Button variant="outline">Sign In</Button>
                                </Link>
                                <Link href="/sign-up">
                                    <Button>Create Account</Button>
                                </Link>
                            </div>
                        </nav>
                    </header>

                    <main className="relative">{children}</main>
                </ThemeProvider>
            </body>
        </html>
    );
}
