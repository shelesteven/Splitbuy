"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");

    if (!oobCode) {
      setError("Invalid verification link.");
      setStatus("error");
      return;
    }

    const handleVerifyEmail = async () => {
      try {
        await checkActionCode(auth, oobCode);
        await applyActionCode(auth, oobCode);
        setStatus("success");
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
        setStatus("error");
      }
    };

    handleVerifyEmail();
  }, [searchParams]);

  return (
    <PageContainer>
      <div className="flex justify-center items-center h-full">
        <Card className="p-8">
          {status === "verifying" && (
            <div>
              <h1 className="text-2xl font-bold">Verifying your email...</h1>
              <p>Please wait while we verify your email address.</p>
            </div>
          )}
          {status === "success" && (
            <div>
              <h1 className="text-2xl font-bold text-green-500">
                Email Verified!
              </h1>
              <p>Your email has been successfully verified.</p>
              <Button onClick={() => router.push("/dashboard")} className="mt-4">
                Go to Dashboard
              </Button>
            </div>
          )}
          {status === "error" && (
            <div>
              <h1 className="text-2xl font-bold text-red-500">
                Verification Failed
              </h1>
              <p>{error}</p>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
} 