"use client";

import { useAuth } from "@/context/AuthUserContext";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";

export function VerifyEmailBanner() {
  const { authUser } = useAuth();

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email sent!");
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    }
  };

  if (authUser && !authUser.emailVerified) {
    return (
      <div className="w-full bg-yellow-400 p-4 text-center text-black">
        <p>
          Your email is not verified. Please check your inbox or{" "}
          <Button
            variant="link"
            className="p-0 h-auto text-black underline"
            onClick={handleResendVerification}
          >
            resend the verification email
          </Button>
          .
        </p>
      </div>
    );
  }

  return null;
} 