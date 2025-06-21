'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthUserContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/PageContainer';

interface UserProfile {
  name: string;
  email: string;
}

export default function MyProfilePage() {
  const { authUser, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.uid) return;

      const docRef = doc(db, 'users', authUser.uid);
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
        <p className="text-lg text-red-500">Unable to load profile. Please sign in.</p>
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
    </PageContainer>
  );
}
