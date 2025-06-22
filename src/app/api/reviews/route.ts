import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { reviewedUserId, groupBuyId, reviewerId, rating, comment } = await request.json();

    if (!reviewedUserId || !groupBuyId || !reviewerId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await runTransaction(db, async (transaction) => {
      const profileRef = doc(db, 'profiles', reviewedUserId);
      const groupBuyRef = doc(db, 'group_buys', groupBuyId);

      const [profileSnap, groupBuySnap] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(groupBuyRef)
      ]);

      if (!profileSnap.exists()) {
        throw new Error('Profile not found');
      }
      
      if (!groupBuySnap.exists()) {
        throw new Error('Group buy not found');
      }

      const profileData = profileSnap.data();
      const groupBuyData = groupBuySnap.data();

      // Ensure user hasn't already reviewed
      const existingReviews = groupBuyData.reviews || {};
      if (existingReviews[reviewerId]) {
        throw new Error('You have already reviewed this user for this group buy.');
      }
      
      // Update profile with new review
      const newReview = {
        rating,
        comment,
        reviewerId,
        groupBuyId,
        createdAt: serverTimestamp(),
      };

      const newTotalRating = (profileData.totalRating || 0) + rating;
      const newReviewCount = (profileData.reviewCount || 0) + 1;

      transaction.update(profileRef, {
        reviews: [...(profileData.reviews || []), newReview],
        totalRating: newTotalRating,
        reviewCount: newReviewCount,
      });

      // Mark that the user has been reviewed in the group buy
      transaction.update(groupBuyRef, {
        [`reviews.${reviewerId}`]: true,
      });
    });

    return NextResponse.json({ message: 'Review submitted successfully' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error submitting review:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 