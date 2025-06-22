import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { groupBuyId, organizerId, reviewerId, rating, comment } = await request.json();

    if (!groupBuyId || !organizerId || !reviewerId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await runTransaction(db, async (transaction) => {
      const organizerProfileRef = doc(db, 'profiles', organizerId);
      const groupBuyRef = doc(db, 'groupBuys', groupBuyId);

      // 1. Get the organizer's profile
      const organizerProfileDoc = await transaction.get(organizerProfileRef);
      if (!organizerProfileDoc.exists()) {
        throw new Error('Organizer profile not found.');
      }
      const organizerData = organizerProfileDoc.data();

      // 2. Get the group buy document
      const groupBuyDoc = await transaction.get(groupBuyRef);
      if (!groupBuyDoc.exists()) {
          throw new Error('Group buy not found.');
      }
      const groupBuyData = groupBuyDoc.data();

      // 3. Check if user has already reviewed
      if (groupBuyData.purchaseRequest?.reviewedBy?.includes(reviewerId)) {
        throw new Error('User has already reviewed this group buy.');
      }

      // 4. Update organizer's profile with new review and stats
      const newReview = {
        reviewerId,
        rating,
        comment: comment || '',
        createdAt: new Date(),
        groupBuyId,
      };

      const newTotalRating = (organizerData.totalRating || 0) + rating;
      const newReviewCount = (organizerData.reviewCount || 0) + 1;
      const newReviewRating = newTotalRating / newReviewCount;

      transaction.update(organizerProfileRef, {
        totalRating: newTotalRating,
        reviewCount: newReviewCount,
        reviewRating: newReviewRating,
        completedGroupBuys: (organizerData.completedGroupBuys || 0) + 1,
        reviews: [...(organizerData.reviews || []), newReview],
      });

      // 5. Mark the group buy as reviewed by this user
      transaction.update(groupBuyRef, {
        'purchaseRequest.reviewedBy': [...(groupBuyData.purchaseRequest?.reviewedBy || []), reviewerId],
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 