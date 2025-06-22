import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const groupBuyId = formData.get("groupBuyId") as string;
    const organizerId = formData.get("organizerId") as string;

    if (!file || !groupBuyId || !organizerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "File must be an image or PDF" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${organizerId}_${timestamp}.${fileExtension}`;
    
    // Save file to uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads", "payments");
    const filePath = join(uploadsDir, fileName);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update the purchase request with the proof
    const groupBuyRef = doc(db, "groupBuys", groupBuyId);
    await updateDoc(groupBuyRef, {
      "purchaseRequest.organizerProof": `/uploads/payments/${fileName}`,
      "purchaseRequest.organizerProofUploadedAt": Timestamp.now(),
      "purchaseRequest.status": "awaiting_participant_approval"
    });

    return NextResponse.json({
      success: true,
      url: `/uploads/payments/${fileName}`
    });

  } catch (error) {
    console.error("Error uploading proof:", error);
    return NextResponse.json(
      { error: "Failed to upload proof" },
      { status: 500 }
    );
  }
} 