"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PaymentParticipant {
  userId: string;
  status: "pending" | "paid" | "confirmed";
  paidAt?: any;
  proofOfPayment?: string | null;
  confirmedAt?: any;
}

interface PaymentManagementProps {
  groupBuyId: string;
  organizerId: string;
  purchaseRequest: {
    amount: number;
    deadline: Date;
    participants: PaymentParticipant[];
  };
  userProfiles: {[key: string]: any};
  onUpdate?: () => void;
}

export function PaymentManagement({ 
  groupBuyId, 
  organizerId, 
  purchaseRequest, 
  userProfiles,
  onUpdate 
}: PaymentManagementProps) {
  const [confirmingPayment, setConfirmingPayment] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const handleConfirmPayment = async (userId: string) => {
    setConfirmingPayment(userId);
    try {
      const response = await fetch("/api/purchase-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupBuyId,
          userId: organizerId, // This should be the organizer's ID for authorization
          action: "confirm_payment",
          participantUserId: userId, // The participant whose payment we're confirming
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm payment");
      }

      toast.success("Payment confirmed!");
      onUpdate?.();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("Failed to confirm payment");
    } finally {
      setConfirmingPayment(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "paid":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "paid":
        return "Awaiting Confirmation";
      default:
        return "Pending Payment";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600";
      case "paid":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  const pendingCount = purchaseRequest.participants.filter(p => p.status === "pending").length;
  const paidCount = purchaseRequest.participants.filter(p => p.status === "paid").length;
  const confirmedCount = purchaseRequest.participants.filter(p => p.status === "confirmed").length;
  const totalCount = purchaseRequest.participants.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Overview</CardTitle>
          <div className="text-sm text-muted-foreground">
            Amount: ${purchaseRequest.amount.toFixed(2)} per person | 
            Deadline: {purchaseRequest.deadline.toLocaleDateString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{paidCount}</div>
              <div className="text-sm text-muted-foreground">Awaiting Review</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-500">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold">
              Total Expected: ${(purchaseRequest.amount * totalCount).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              Confirmed: ${(purchaseRequest.amount * confirmedCount).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participant Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {purchaseRequest.participants.map((participant) => (
              <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(participant.status)}
                  <div>
                    <div className="font-medium">
                      {userProfiles[participant.userId]?.name || "Unknown User"}
                    </div>
                    <div className={`text-sm ${getStatusColor(participant.status)}`}>
                      {getStatusText(participant.status)}
                    </div>
                    {participant.paidAt && (
                      <div className="text-xs text-muted-foreground">
                        Paid: {new Date(participant.paidAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                                     {participant.proofOfPayment && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setViewingProof(participant.proofOfPayment || null)}
                     >
                       <Eye className="w-4 h-4 mr-1" />
                       View Proof
                     </Button>
                   )}
                  
                  {participant.status === "paid" && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmPayment(participant.userId)}
                      disabled={confirmingPayment === participant.userId}
                    >
                      {confirmingPayment === participant.userId ? "Confirming..." : "Confirm Payment"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proof of Payment Modal */}
      {viewingProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Proof of Payment</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingProof(null)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <Image
                src={viewingProof}
                alt="Proof of payment"
                width={600}
                height={400}
                className="w-full h-auto rounded border"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 