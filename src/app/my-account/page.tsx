"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthUserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/PageContainer';

interface UserProfile {
  name: string;
  email: string;
  cardLast4?: string;
  cardBrand?: string;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

export default function MyProfilePage() {
  const { authUser, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.uid) return;

      const docRef = doc(db, "users", authUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
      setFetching(false);
    };

    fetchProfile();
  }, [authUser]);

  if (loading || fetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!authUser || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-500">
          Unable to load profile. Please sign in.
        </p>
      </div>
    );
  }

  return (
    <PageContainer className="flex justify-center items-center">
      <Card className="max-w-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-8">My Profile</h1>
  
      <div className="space-y-6">
          <div>
            <h2 className="text-sm uppercase tracking-wide font-semibold">Username</h2>
            <p className="text-xl font-medium text-foreground/60">{profile.name}</p>
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-wide font-semibold">Email</h2>
            <p className="text-xl font-medium text-foreground/60">{profile.email}</p>
          </div>
        </div>
      </Card>

      {/* Credit Card Section */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          💳 Credit Card
        </h2>

        {profile.cardLast4 && profile.cardBrand ? (
          <div className="bg-gray-50 p-4 rounded-lg border flex items-center gap-4">
            <div className="text-4xl">
              {getCardBrandEmoji(profile.cardBrand)}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-800">
                {capitalize(profile.cardBrand)} •••• {profile.cardLast4}
              </p>
              {profile.billingName && (
                <p className="text-sm text-gray-600">Name: {profile.billingName}</p>
              )}
              {profile.billingEmail && (
                <p className="text-sm text-gray-600">Email: {profile.billingEmail}</p>
              )}
              {profile.billingAddress && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Address:</p>
                  <p>{profile.billingAddress.line1}</p>
                  {profile.billingAddress.line2 && <p>{profile.billingAddress.line2}</p>}
                  <p>
                    {profile.billingAddress.city}, {profile.billingAddress.state}{' '}
                    {profile.billingAddress.postal_code}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No card info available.</p>
            <a
              href="/credit-card"
              className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              Set up payment card
            </a>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

// Helper: Emoji for card brand
function getCardBrandEmoji(brand: string) {
  switch (brand.toLowerCase()) {
    case 'visa':
      return '💳';
    case 'mastercard':
      return '💳';
    case 'amex':
      return '💠';
    case 'discover':
      return '🌐';
    default:
      return '💳';
  }
}

// Helper: Capitalize text
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
