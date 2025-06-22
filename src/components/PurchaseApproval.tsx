"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PurchaseApprovalProps {
  groupBuyId: string;
  userId: string;
  purchaseRequest: {
    amount: number;
    organizerProof: string;
    organizerProofUploadedAt: string;
  };
  userStatus: "awaiting_approval" | "approved" | "rejected";
  onUpdate?: () => void;
}

export function PurchaseApproval({ 
  groupBuyId, 
  userId, 
  purchaseRequest, 
  userStatus,
  onUpdate 
}: PurchaseApprovalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingProof, setViewingProof] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/purchase-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupBuyId,
          userId,
          action: "approve_purchase",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve purchase");
      }

      toast.success("Purchase approved! Payment request confirmed.");
      onUpdate?.();
    } catch (error) {
      console.error("Error approving purchase:", error);
      toast.error("Failed to approve purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/purchase-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupBuyId,
          userId,
          action: "reject_purchase",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject purchase");
      }

      toast.success("Purchase rejected. Organizer has been notified.");
      onUpdate?.();
    } catch (error) {
      console.error("Error rejecting purchase:", error);
      toast.error("Failed to reject purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusDisplay = () => {
    switch (userStatus) {
      case "approved":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: "✅ Purchase Approved",
          message: "You have approved this purchase. Payment confirmed!",
          color: "text-green-600"
        };
      case "rejected":
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          title: "❌ Purchase Rejected",
          message: "You have rejected this purchase.",
          color: "text-red-600"
        };
      default:
        return {
          icon: <Eye className="w-5 h-5 text-blue-600" />,
          title: "📋 Review Purchase Proof",
          message: "Please review the organizer's proof of purchase and approve or reject.",
          color: "text-blue-600"
        };
    }
  };

  const status = getStatusDisplay();
  const isPdf = purchaseRequest.organizerProof?.endsWith('.pdf');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${status.color}`}>
            {status.icon}
            {status.title}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <p>Amount to pay: ${purchaseRequest.amount.toFixed(2)}</p>
            <p>Proof uploaded: {new Date(purchaseRequest.organizerProofUploadedAt).toLocaleString()}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {status.message}
          </p>

          {/* Proof Preview */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Organizer's Proof of Purchase</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingProof(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Full Size
              </Button>
            </div>
            
            {isPdf ? (
              <div className="text-center p-8 bg-gray-50 rounded border-2 border-dashed">
                <p className="text-gray-600 mb-2">📄 PDF Receipt</p>
                <a 
                  href={purchaseRequest.organizerProof} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Click to view PDF
                </a>
              </div>
            ) : (
              <Image
                src={purchaseRequest.organizerProof}
                alt="Proof of purchase"
                width={300}
                height={200}
                className="w-full h-48 object-cover rounded border"
              />
            )}
          </div>

          {/* Action Buttons */}
          {userStatus === "awaiting_approval" && (
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Processing..." : "✅ Approve & Pay"}
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                {isProcessing ? "Processing..." : "❌ Reject"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Size Proof Modal */}
      {viewingProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Proof of Purchase</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingProof(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              {isPdf ? (
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">📄 PDF Receipt</p>
                  <a 
                    href={purchaseRequest.organizerProof} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              ) : (
                <Image
                  src={purchaseRequest.organizerProof}
                  alt="Proof of purchase"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded border"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 