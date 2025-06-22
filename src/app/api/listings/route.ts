import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import tempStore from "@/lib/temp-store";

// Service account credentials from environment variables
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string,
);

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Basic HTML tag sanitizer
const sanitize = (str: string) => {
  if (!str) return "";
  return str.replace(/<[^>]*>?/gm, "");
};

export async function POST(request: Request) {
  try {
    const { token, name, numberOfPeople, userId } = await request.json();

    if (!token || !tempStore.has(token)) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
    }

    const listingData = tempStore.get(token);
    // Important: Delete the token after use to prevent replay attacks
    tempStore.delete(token);

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    if (!listingData) {
      return NextResponse.json({ error: "Listing data is required" }, { status: 400 });
    }
    
    // Validate numberOfPeople
    if (
      numberOfPeople < listingData.minPeople ||
      numberOfPeople > listingData.maxPeople
    ) {
      return NextResponse.json(
        { error: "Number of people is out of the allowed range." },
        { status: 400 },
      );
    }
    
    const sanitizedName = sanitize(name || listingData.name);
    if (!sanitizedName) {
        return NextResponse.json({ error: "Product name cannot be empty." }, { status: 400 });
    }

    // Combine secure data with user-editable fields
    const finalListingData = {
      ...listingData,
      name: sanitizedName,
      numberOfPeople,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
    };

    // 1. Create a new document in the 'listings' collection
    const listingRef = await db.collection("listings").add(finalListingData);

    // 2. Get the ID of the new listing
    const newListingId = listingRef.id;

    // 3. Update the user's document to include the new listing ID
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      listings: FieldValue.arrayUnion(newListingId),
    });

    return NextResponse.json({
      message: "Listing created successfully",
      listingId: newListingId,
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
} 