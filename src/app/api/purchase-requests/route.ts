import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, serverTimestamp, arrayUnion } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { groupBuyId, organizerId, amount, deadline, message } = await request.json();

    if (!groupBuyId || !organizerId || !amount || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("1");

    // Verify the user is the organizer
    const groupBuyDoc = await getDoc(doc(db, "groupBuys", groupBuyId));
    if (!groupBuyDoc.exists()) {
      return NextResponse.json(
        { error: "Group buy not found" },
        { status: 404 }
      );
    }

    console.log("1.5");

    const groupBuyData = groupBuyDoc.data();
    if (groupBuyData.organizer !== organizerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create purchase request
    const purchaseRequest = {
      id: `pr_${Date.now()}`,
      organizerId,
      amount,
      deadline: new Date(deadline),
      message: message || "",
      status: "awaiting_organizer_proof", // awaiting_organizer_proof, awaiting_participant_approval, completed
      createdAt: serverTimestamp(),
      organizerProof: null, // Organizer uploads proof of purchase here
      organizerProofUploadedAt: null,
      participants: groupBuyData.participants
        .filter((p: any) => p.userId !== organizerId) // Exclude organizer from participants list
        .map((p: any) => ({
          userId: p.userId,
          status: "awaiting_organizer_proof", // awaiting_organizer_proof, approved, rejected
          approvedAt: null,
        })),
    };

    console.log("2");

    // Update group buy with purchase request and change status
    await updateDoc(doc(db, "groupBuys", groupBuyId), {
      purchaseRequest,
      status: "purchasing",
    });

    console.log("3");

    // Add notification message to chat
    await updateDoc(doc(db, "chats", groupBuyId), {
      messages: arrayUnion({
        id: `msg_${Date.now()}`,
        text: `🛒 Purchase request initiated! Organizer will buy the items and upload proof. Each participant will pay $${amount}. Purchase deadline: ${new Date(deadline).toLocaleDateString()}. ${message ? `Note: ${message}` : ''}`,
        senderId: "system",
        timestamp: new Date().toISOString(),
        type: "purchase_request",
      }),
    });

    console.log("4");

    return NextResponse.json({ success: true, purchaseRequest });
  } catch (error) {
    console.error("Error creating purchase request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { groupBuyId, userId, action, proofOfPurchase } = await request.json();

    if (!groupBuyId || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const groupBuyDoc = await getDoc(doc(db, "groupBuys", groupBuyId));
    if (!groupBuyDoc.exists()) {
      return NextResponse.json(
        { error: "Group buy not found" },
        { status: 404 }
      );
    }

    const groupBuyData = groupBuyDoc.data();
    const purchaseRequest = groupBuyData.purchaseRequest;

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: "No active purchase request" },
        { status: 404 }
      );
    }

    let updatedPurchaseRequest = { ...purchaseRequest };
    let chatMessage = "";

    if (action === "upload_organizer_proof") {
      // Organizer uploads proof of purchase
      if (groupBuyData.organizer !== userId) {
        return NextResponse.json(
          { error: "Only organizer can upload proof of purchase" },
          { status: 403 }
        );
      }

      updatedPurchaseRequest = {
        ...purchaseRequest,
        organizerProof: proofOfPurchase,
        organizerProofUploadedAt: new Date(),
        status: "awaiting_participant_approval",
        participants: purchaseRequest.participants.map((p: any) => ({
          ...p,
          status: "awaiting_approval"
        }))
      };

      chatMessage = `🛒 Organizer has uploaded proof of purchase! Please review and approve.`;

    } else if (action === "approve_purchase") {
      // Participant approves organizer's proof
      const updatedParticipants = purchaseRequest.participants.map((p: any) => {
        if (p.userId === userId) {
          return {
            ...p,
            status: "approved",
            approvedAt: new Date(),
          };
        }
        return p;
      });

      updatedPurchaseRequest = {
        ...purchaseRequest,
        participants: updatedParticipants,
      };

      // Check if all participants have approved
      const allApproved = updatedParticipants.every((p: any) => p.status === "approved");
      if (allApproved) {
        updatedPurchaseRequest.status = "completed";
        chatMessage = `🎉 All participants have approved! Purchase completed successfully.`;
      } else {
        chatMessage = `✅ Participant approved the purchase`;
      }

    } else if (action === "reject_purchase") {
      // Participant rejects organizer's proof
      const updatedParticipants = purchaseRequest.participants.map((p: any) => {
        if (p.userId === userId) {
          return {
            ...p,
            status: "rejected",
            approvedAt: new Date(),
          };
        }
        return p;
      });

      updatedPurchaseRequest = {
        ...purchaseRequest,
        participants: updatedParticipants,
      };

      chatMessage = `❌ Participant rejected the purchase proof`;
    }

    // Update group buy status
    let newGroupBuyStatus = "purchasing";
    if (updatedPurchaseRequest.status === "completed") {
      newGroupBuyStatus = "completed";
    }

    await updateDoc(doc(db, "groupBuys", groupBuyId), {
      purchaseRequest: updatedPurchaseRequest,
      status: newGroupBuyStatus,
    });

    // Add chat message
    if (chatMessage) {
      await updateDoc(doc(db, "chats", groupBuyId), {
        messages: arrayUnion({
          id: `msg_${Date.now()}`,
          text: chatMessage,
          senderId: "system",
          timestamp: new Date().toISOString(),
          type: "purchase_update",
        }),
      });
    }

    return NextResponse.json({ success: true, purchaseRequest: updatedPurchaseRequest });
  } catch (error) {
    console.error("Error updating purchase request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 