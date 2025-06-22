"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthUserContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RequirePaymentMethodProps {
  children: React.ReactNode;
}

export function RequirePaymentMethod({ children }: RequirePaymentMethodProps) {
  const { authUser, loading: authLoading } = useAuth();
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkPaymentMethod = async () => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasPayment = userData.hasPaymentMethod || false;
          setHasPaymentMethod(hasPayment);
          
          if (!hasPayment) {
            toast.error("Please add a payment method to continue using the platform.");
            router.push("/credit-card");
          }
        } else {
          setHasPaymentMethod(false);
          toast.error("Please add a payment method to continue using the platform.");
          router.push("/credit-card");
        }
      } catch (error) {
        console.error("Error checking payment method:", error);
        toast.error("Error checking payment method. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkPaymentMethod();
    }
  }, [authUser, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    return null; // Let other auth guards handle this
  }

  if (hasPaymentMethod === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to payment setup...</div>
      </div>
    );
  }

  return <>{children}</>;
} 