'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthUserContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    <div className="max-w-xl mx-auto mt-20 px-6 py-10 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h1 className="text-3xl font-bold text-center mb-8">My Profile</h1>
      <div className="space-y-6">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Username</h2>
          <p className="text-xl font-medium text-gray-800">{profile.name}</p>
        </div>
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Email</h2>
          <p className="text-xl font-medium text-gray-800">{profile.email}</p>
        </div>
      </div>
    </div>
  );
}
