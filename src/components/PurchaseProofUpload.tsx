import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PurchaseProofUploadProps {
  groupBuyId: string;
  organizerId: string;
  amount: number;
  deadline: Date;
  currentProof?: string | null;
  purchaseStatus: 'awaiting_payments' | 'ready_for_purchase' | 'awaiting_proof_approval' | 'completed';
  onUploadSuccess?: () => void;
}

export function PurchaseProofUpload({ 
  groupBuyId,
  organizerId,
  amount,
  deadline,
  currentProof,
  purchaseStatus,
  onUploadSuccess
}: PurchaseProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = amount * (1); // Will need to calculate based on participant count
  const isOverdue = new Date() > deadline;

  if (purchaseStatus === 'awaiting_payments') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⏳ Waiting for Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You can upload your proof of purchase after all participants have paid their share.
          </p>
        </CardContent>
      </Card>
    )
  }

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

    const formData = new FormData();
    formData.append("file", uploadedFile, uploadedFile.name);

    try {
      // Replace with actual API call to upload proof
      // For now, we'll simulate a successful upload
      console.log("Uploading file:", uploadedFile);
      setIsUploading(false);
      setIsSubmitting(false);
      onUploadSuccess?.();
    } catch (error) {
      console.error("Error uploading proof:", error);
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        {/* ... existing code ... */}
      </CardHeader>
      <CardContent>
        {/* ... existing code ... */}
        <Button
          onClick={handleSubmitProof}
          disabled={!uploadedFile || isSubmitting || isUploading}
          className="w-full"
        >
          {/* ... existing code ... */}
        </Button>
      </CardContent>
    </Card>
  );
} 