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
  const { authUser, loading } = useAuth(); // If you're using the AuthUserContext

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
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-950">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6 bg-gray-900 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
          <p className="text-gray-400">
            {authUser?.email || "You're signed in"}
          </p>

          <Button
            onClick={handleLogout}
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Logout
          </Button>
        </Card>

        {/* You can add more cards or components here */}
      </div>
    </div>
  );
}
