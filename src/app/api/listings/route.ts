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

// Simple geocoding function with coordinate anonymization
const geocodeAddress = async (address: any): Promise<{ lat: number; lng: number } | null> => {
  if (!address?.line1) return null;
  
  try {
    const addressString = `${address.line1}, ${address.city}, ${address.state} ${address.postal_code}, ${address.country}`;
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      addressString,
    )}.json?access_token=${mapboxToken}&limit=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      
      // Anonymize coordinates by rounding to reduce precision
      // Rounding to 2 decimal places = ~1km precision
      // Rounding to 3 decimal places = ~100m precision
      const anonymizedLat = Math.round(lat * 100) / 100; // ~1km precision
      const anonymizedLng = Math.round(lng * 100) / 100; // ~1km precision
      
      return { lat: anonymizedLat, lng: anonymizedLng };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
  }
  return null;
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

    // Get user's pickup address and geocode it
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const pickupAddress = userData.pickupAddress;

    if (!pickupAddress?.line1) {
      return NextResponse.json({ error: "User is missing a pickup address." }, { status: 400 });
    }

    // Geocode the address to get coordinates
    const coordinates = await geocodeAddress(pickupAddress);

    // Combine secure data with user-editable fields
    const finalListingData = {
      ...listingData,
      name: sanitizedName,
      numberOfPeople,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      coordinates,
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