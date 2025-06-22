import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, serverTimestamp, arrayUnion } from "firebase/firestore";

interface Participant {
  userId: string;
  paid: boolean;
  paymentProof: string | null;
  paidAt: Date | null;
  status: 'unpaid' | 'paid' | 'awaiting_approval' | 'approved' | 'rejected';
  approvedAt: Date | null;
}

export async function POST(request: NextRequest) {
  try {
    const { groupBuyId, organizerId, amount, deadline, message } = await request.json();

    if (!groupBuyId || !organizerId || !amount || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the user is the organizer
    const groupBuyDoc = await getDoc(doc(db, "groupBuys", groupBuyId));
    if (!groupBuyDoc.exists()) {
      return NextResponse.json(
        { error: "Group buy not found" },
        { status: 404 }
      );
    }

    const groupBuyData = groupBuyDoc.data();
    if (groupBuyData.organizer !== organizerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create purchase request with paid flags for each participant
    const purchaseRequest = {
      id: `pr_${Date.now()}`,
      organizerId,
      amount,
      deadline: new Date(deadline),
      message: message || "",
      status: "awaiting_payments", // awaiting_payments, ready_for_purchase, awaiting_proof_approval, completed
      createdAt: serverTimestamp(),
      organizerProof: null,
      organizerProofUploadedAt: null,
      participants: groupBuyData.participants
        .filter((p: { userId: string }) => p.userId !== organizerId) // Exclude organizer from participants list
        .map((p: { userId: string }) => ({
          userId: p.userId,
          paid: false, // Track payment status
          paymentProof: null, // Participant uploads payment proof
          paidAt: null,
          status: "unpaid", // unpaid, paid, awaiting_approval, approved, rejected
          approvedAt: null,
        })),
    };

    // Update group buy with purchase request and change status
    await updateDoc(doc(db, "groupBuys", groupBuyId), {
      purchaseRequest,
      status: "purchasing",
    });

    // Add notification message to chat
    await updateDoc(doc(db, "chats", groupBuyId), {
      messages: arrayUnion({
        id: `msg_${Date.now()}`,
        text: `💰 Payment collection started! Each participant needs to pay $${amount} before the organizer can make the purchase. Payment deadline: ${new Date(deadline).toLocaleDateString()}. ${message ? `Note: ${message}` : ''}`,
        senderId: "system",
        timestamp: new Date().toISOString(),
        type: "purchase_request",
      }),
    });

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

    if (action === "submit_payment") {
      // Participant submits payment
      const updatedParticipants = purchaseRequest.participants.map((p: Participant) => {
        if (p.userId === userId) {
          return {
            ...p,
            paid: true,
            paymentProof: null,
            paidAt: new Date(),
            status: "paid"
          };
        }
        return p;
      });

      updatedPurchaseRequest = {
        ...purchaseRequest,
        participants: updatedParticipants,
      };

      // Check if all participants have paid
      const allPaid = updatedParticipants.every((p: Participant) => p.paid === true);
      if (allPaid) {
        updatedPurchaseRequest.status = "ready_for_purchase";
        chatMessage = `✅ All participants have paid! Organizer can now make the purchase and upload proof.`;
      } else {
        const paidCount = updatedParticipants.filter((p: Participant) => p.paid).length;
        const totalCount = updatedParticipants.length;
        chatMessage = `💰 Payment received! ${paidCount}/${totalCount} participants have paid.`;
      }

    } else if (action === "upload_organizer_proof") {
      // Organizer uploads proof of purchase (only after all participants have paid)
      if (groupBuyData.organizer !== userId) {
        return NextResponse.json(
          { error: "Only organizer can upload proof of purchase" },
          { status: 403 }
        );
      }

      if (purchaseRequest.status !== "ready_for_purchase") {
        return NextResponse.json(
          { error: "Cannot upload proof until all participants have paid" },
          { status: 400 }
        );
      }

      updatedPurchaseRequest = {
        ...purchaseRequest,
        organizerProof: proofOfPurchase,
        organizerProofUploadedAt: new Date(),
        status: "awaiting_proof_approval",
        participants: purchaseRequest.participants.map((p: Participant) => ({
          ...p,
          status: "awaiting_approval"
        }))
      };

      chatMessage = `🛒 Organizer has uploaded proof of purchase! Please review and confirm your items are included.`;

    } else if (action === "approve_purchase") {
      // Participant approves organizer's proof
      const updatedParticipants = purchaseRequest.participants.map((p: Participant) => {
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
      const allApproved = updatedParticipants.every((p: Participant) => p.status === "approved");
      if (allApproved) {
        updatedPurchaseRequest.status = "completed";
        chatMessage = `🎉 All participants have confirmed! Purchase completed successfully.`;
      } else {
        const approvedCount = updatedParticipants.filter((p: Participant) => p.status === "approved").length;
        const totalCount = updatedParticipants.length;
        chatMessage = `✅ Purchase confirmed! ${approvedCount}/${totalCount} participants have confirmed.`;
      }

    } else if (action === "reject_purchase") {
      // Participant rejects organizer's proof
      const updatedParticipants = purchaseRequest.participants.map((p: Participant) => {
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

      chatMessage = `❌ Purchase proof rejected. Please contact the organizer.`;
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

    // Add chat message if there is one
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