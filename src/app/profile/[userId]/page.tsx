"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageContainer } from "@/components/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ShoppingBag, MessageSquare } from "lucide-react";

type Profile = {
  name: string;
  reviewRating: number | null;
  reviews: string[];
  completedGroupBuys: number;
};

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        const profileRef = doc(db, "profiles", userId);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as Profile);
        }
        setLoading(false);
      };

      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-full">
          <p>Loading profile...</p>
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-full">
          <p>User profile not found.</p>
        </div>
      </PageContainer>
    );
  }

  const validReviews = profile.reviews.filter(review => review.trim() !== "");

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column for Profile Info */}
          <div className="md:col-span-1">
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`} />
                  <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold truncate w-full">{profile.name}</h1>
                <div className="flex items-center mt-2">
                  {profile.reviewRating ? (
                    <>
                      {[...Array(Math.round(profile.reviewRating))].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" />
                      ))}
                      {[...Array(5 - Math.round(profile.reviewRating))].map(
                        (_, i) => (
                          <Star key={i} className="h-5 w-5 text-gray-300" />
                        ),
                      )}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({profile.reviewRating.toFixed(1)})
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No reviews yet</span>
                  )}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground mr-3" />
                  <span className="font-medium">Completed Group Buys:</span>
                  <span className="ml-auto font-semibold">{profile.completedGroupBuys}</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-muted-foreground mr-3" />
                  <span className="font-medium">Reviews:</span>
                  <span className="ml-auto font-semibold">{validReviews.length}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column for Reviews */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>User Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {validReviews.length > 0 ? (
                  <ul className="space-y-4">
                    {validReviews.map((review, index) => (
                      <li key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-muted-foreground">{review}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">This user hasn&apos;t received any reviews yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 