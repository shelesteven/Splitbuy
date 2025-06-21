import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Splitbuy | Save More Together",
    description: "Join group buys and save on shipping and bulk products.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen font-sans antialiased bg-white text-gray-900">
                <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-zinc-200 shadow-sm">
                    <nav className="container mx-auto flex items-center justify-between px-4 py-4">
                        <Link href="/" className="text-2xl font-bold text-indigo-600 tracking-tight">
                            Splitbuy
                        </Link>

                        <div className="flex items-center space-x-3">
                            <Link href="/sign-in">
                                <Button variant="ghost">Sign In</Button>
                            </Link>
                            <Link href="/sign-up">
                                <Button>Create Account</Button>
                            </Link>
                        </div>
                    </nav>
                </header>

                <main>{children}</main>
            </body>
        </html>
    );
}
