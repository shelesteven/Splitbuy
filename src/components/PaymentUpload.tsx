"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PurchaseProofUploadProps {
  groupBuyId: string;
  organizerId: string;
  amount: number;
  deadline: Date;
  currentProof?: string | null;
  onUploadSuccess?: () => void;
}

export function PurchaseProofUpload({ 
  groupBuyId, 
  organizerId, 
  amount, 
  deadline, 
  currentProof,
  onUploadSuccess 
}: PurchaseProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentProof || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error("Please select an image or PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", organizerId);
      formData.append("groupBuyId", groupBuyId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      setUploadedFile(result.url);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!uploadedFile) {
      toast.error("Please upload proof of purchase first");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/purchase-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupBuyId,
          userId: organizerId,
          action: "upload_organizer_proof",
          proofOfPurchase: uploadedFile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit proof");
      }

      toast.success("Proof of purchase submitted! Participants can now review and approve.");
      onUploadSuccess?.();
    } catch (error) {
      console.error("Error submitting proof:", error);
      toast.error("Failed to submit proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalAmount = amount * (1); // Will need to calculate based on participant count
  const isOverdue = new Date() > deadline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🛒 Upload Proof of Purchase
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>Amount per participant: ${amount.toFixed(2)}</p>
          <p>Purchase deadline: {deadline.toLocaleDateString()}</p>
          {isOverdue && (
            <p className="text-red-600 font-medium">⚠️ Purchase deadline has passed</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Upload your receipt, invoice, or confirmation showing you purchased the items. 
            Participants will review this to verify the purchase before approving payment.
          </p>
          
          {!uploadedFile ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="purchase-proof"
              />
              <label
                htmlFor="purchase-proof"
                className={`
                  flex flex-col items-center justify-center w-full h-32 
                  border-2 border-dashed border-gray-300 rounded-lg cursor-pointer 
                  hover:bg-gray-50 transition-colors
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> proof of purchase
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG, PDF (MAX. 10MB)</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Proof of purchase uploaded</p>
                  {uploadedFile.endsWith('.pdf') ? (
                    <a 
                      href={uploadedFile} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-1 block"
                    >
                      View PDF Receipt
                    </a>
                  ) : (
                    <Image 
                      src={uploadedFile} 
                      alt="Purchase proof" 
                      width={200} 
                      height={150} 
                      className="mt-2 rounded border object-cover"
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmitProof}
          disabled={!uploadedFile || isSubmitting || isUploading}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Proof of Purchase"}
        </Button>
      </CardContent>
    </Card>
  );
} 