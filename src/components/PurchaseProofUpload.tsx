import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock } from 'lucide-react';

interface Participant {
  userId: string;
  paid: boolean;
  paymentProof: string | null;
  paidAt: Date | null;
  status: 'unpaid' | 'paid' | 'awaiting_approval' | 'approved' | 'rejected';
}

interface UserProfile {
  name: string;
  photoURL?: string;
}

interface PurchaseProofUploadProps {
  groupBuyId: string;
  organizerId: string;
  currentProof?: string | null;
  purchaseStatus: 'awaiting_payments' | 'ready_for_purchase' | 'awaiting_proof_approval' | 'completed';
  participants: Participant[];
  userProfiles: {[key: string]: UserProfile};
  onUploadSuccess?: () => void;
}

export function PurchaseProofUpload({ 
  groupBuyId,
  organizerId,
  currentProof,
  purchaseStatus,
  participants,
  userProfiles,
  onUploadSuccess
}: PurchaseProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const paidCount = participants.filter(p => p.paid).length;
  const totalCount = participants.length;
  const allPaid = paidCount === totalCount;
  const progressValue = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  const handleSubmitProof = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setIsUploading(true);

    if (!uploadedFile) {
      console.error("No file uploaded");
      setIsUploading(false);
      setIsSubmitting(false);
      return;
    }

    try {
      // First upload the file
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("userId", organizerId);
      formData.append("groupBuyId", groupBuyId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      const uploadResult = await uploadResponse.json();
      const fileUrl = uploadResult.url;

      // Then submit the proof to the purchase request
      const response = await fetch("/api/purchase-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupBuyId,
          userId: organizerId,
          action: "upload_organizer_proof",
          proofOfPurchase: fileUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit proof");
      }

      console.log("Proof uploaded successfully");
      onUploadSuccess?.();

    } catch (error) {
      console.error("Error uploading proof:", error);
      alert(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  // Show payment progress when waiting for payments
  if (purchaseStatus === 'awaiting_payments') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏳ Waiting for Payments
          </CardTitle>
          <CardDescription>
            Track participant payments below. You can upload proof of purchase after everyone has paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Payment Progress</p>
              <p className="text-sm font-bold">{paidCount} / {totalCount} Paid</p>
            </div>
            <Progress value={progressValue} />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {participants.map(p => (
              <div key={p.userId} className="flex items-center justify-between p-2 rounded-md border">
                <span>{userProfiles[p.userId]?.name || 'Unknown User'}</span>
                {p.paid ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" /> Paid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <Clock className="h-4 w-4" /> Unpaid
                  </span>
                )}
              </div>
            ))}
          </div>

          {allPaid ? (
            <div className="text-center text-sm text-green-600 font-medium pt-4 border-t">
              ✅ All participants have paid! You can now make the purchase and upload proof.
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              Waiting for all participants to complete their payment.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show upload form when ready for purchase
  if (purchaseStatus === 'ready_for_purchase') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload Proof of Purchase</CardTitle>
          <CardDescription>
            All participants have paid. Please make the purchase and upload the proof.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProof} className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)}
              disabled={isSubmitting}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || isUploading}
            >
              Browse File
            </Button>
            {uploadedFile && (
              <p className="text-sm text-muted-foreground">
                Selected file: {uploadedFile.name}
              </p>
            )}
            <Button
              type="submit"
              disabled={!uploadedFile || isSubmitting || isUploading}
              className="w-full"
            >
              {isSubmitting ? 'Uploading...' : 'Upload Proof'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Show waiting message when proof is uploaded and waiting for approvals
  if (purchaseStatus === 'awaiting_proof_approval') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Proof Uploaded</CardTitle>
          <CardDescription>
            Waiting for participants to confirm the purchase proof.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentProof && (
            <a 
              href={currentProof} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline"
            >
              View Uploaded Proof
            </a>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show completion message
  if (purchaseStatus === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600">✅ All participants have confirmed the purchase!</p>
        </CardContent>
      </Card>
    );
  }

  return null;
} 