"use client";

import "./globals.css";
import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthUserProvider, useAuth } from "@/context/AuthUserContext";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans antialiased overflow-y-scroll">
        <AuthUserProvider>
          <ThemeProvider attribute="class" enableSystem>
            <SiteHeader />
            <main className="grow flex flex-col h-full overflow-auto">
              {children}
            </main>
            <Toaster theme="system" />
          </ThemeProvider>
        </AuthUserProvider>
      </body>
    </html>
  );
}

// Navigation header
function SiteHeader() {
  const { authUser, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-neutral-300 dark:border-neutral-800 shadow-xl">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Splitbuy
        </Link>

        {authUser ? (
          <div className="relative">
            <Button variant="outline" onClick={() => setOpen(!open)}>
              {authUser.email}
            </Button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  Profile
                </Link>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700"
                  onClick={() => {
                    signOut();
                    router.push("/sign-in");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
