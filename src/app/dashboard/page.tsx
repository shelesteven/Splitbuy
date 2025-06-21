"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthUserContext";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const { authUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/sign-in");
    }
  }, [authUser, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/sign-in");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0d061f]">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0033] to-[#10002b] text-white px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="p-8 rounded-2xl shadow-xl border border-purple-700 bg-gradient-to-br from-purple-800/60 to-pink-800/60 text-white">
          <h1 className="text-3xl font-extrabold mb-3 text-white">
            Welcome to your Dashboard
          </h1>
          <p className="text-pink-200 font-medium mb-6">
            {authUser?.email || "You're signed in"}
          </p>

          <Button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-2"
          >
            Logout
          </Button>
        </Card>
      </div>
    </div>
  );
}
