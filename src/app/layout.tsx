"use client";

import "./globals.css";
import { ReactNode, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle, MessageCircle, LayoutDashboard, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthUserProvider, useAuth } from "@/context/AuthUserContext";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col font-sans antialiased overflow-y-scroll">
                <AuthUserProvider>
                    <ThemeProvider attribute="class" enableSystem>
                        <VerifyEmailBanner />
                        <SiteHeader />
                        <main className="grow flex flex-col h-full overflow-auto">{children}</main>
                        <Toaster theme="system" />
                    </ThemeProvider>
                </AuthUserProvider>
            </body>
        </html>
    );
}

// Navigation header
function SiteHeader() {
    const { authUser, loading, signOut } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    return (
        <header className="sticky top-0 z-50 w-full bg-neutral-100 dark:bg-neutral-900 backdrop-blur-sm shadow-md">
            <nav className="mx-auto flex items-center justify-between px-6 md:px-16 py-4">
                <Link href="/" className="text-2xl font-bold tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors">
                    SplitBuy
                </Link>

                {!loading && authUser ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <Link href="/my-listings" title="My Listings">
                                <List className="w-6 h-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" />
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <Link href="/dashboard" title="Dashboard">
                                <LayoutDashboard className="w-6 h-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" />
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <Link href="/chats" title="Chats">
                                <MessageCircle className="w-6 h-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" />
                            </Link>
                        </div>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setOpen(!open)} className="flex items-center cursor-pointer rounded-full transition" title="Profile">
                                <UserCircle className="w-6 h-6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" />
                            </button>

                            {open && (
                                <div className="absolute right-0 mt-2 w-48 border rounded-md border-gray-200 dark:border-gray-700 shadow-lg z-50">
                                    <Link href="/my-account" className="block px-4 py-2 bg-white dark:bg-black rounded-t-md hover:bg-gray-100 dark:hover:bg-gray-800">
                                        My Account
                                    </Link>
                                    <Link href={`/profile/${authUser.uid}`} className="block px-4 py-2 bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800">
                                        Profile
                                    </Link>
                                    <button
                                        className="cursor-pointer w-full text-left px-4 py-2 bg-white dark:bg-black rounded-b-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                        onClick={() => {
                                            signOut();
                                            router.push("/sign-in");
                                        }}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        <Link href="/sign-in">
                            <Button variant="ghost" className="cursor-pointer border">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90">Sign Up</Button>
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    );
}
