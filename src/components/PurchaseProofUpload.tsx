import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantPaymentStatus {
  userId: string;
  paid: boolean;
}

interface UserProfile {
    name: string;
    photoURL: string;
}

interface PurchaseProofUploadProps {
  groupBuyId: string;
  organizerId: string;
  currentProof?: string | null;
  participants: ParticipantPaymentStatus[];
  userProfiles: {[key: string]: UserProfile};
  onUploadSuccess?: () => void;
}

export function PurchaseProofUpload({ 
  groupBuyId,
  organizerId,
  currentProof,
  participants,
  userProfiles,
  onUploadSuccess
}: PurchaseProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paidCount = participants.filter(p => p.paid).length;
  const totalCount = participants.length;
  const allPaid = paidCount === totalCount;
  const progressValue = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  const handleSubmitProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('groupBuyId', groupBuyId);
    formData.append('organizerId', organizerId);

    try {
      const response = await fetch('/api/upload-proof', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      toast.success("Proof of purchase uploaded successfully!");
      onUploadSuccess?.();

    } catch (error) {
      console.error("Error uploading proof:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  if (currentProof) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Proof Uploaded</CardTitle>
                <CardDescription>You have already uploaded the proof of purchase. Waiting for participant approvals.</CardDescription>
            </CardHeader>
            <CardContent>
                <a href={currentProof} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Uploaded Proof</a>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collect Payments & Purchase</CardTitle>
        <CardDescription>
            Track participant payments below. Once everyone has paid, you can upload the proof of purchase.
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
                    <span>{userProfiles[p.userId]?.name || '...'}</span>
                    {p.paid ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="h-4 w-4" /> Paid</span>
                    ) : (
                        <span className="flex items-center gap-1 text-yellow-600 text-sm"><XCircle className="h-4 w-4" /> Unpaid</span>
                    )}
                </div>
            ))}
        </div>

        {allPaid ? (
            <form onSubmit={handleSubmitProof} className="space-y-4 pt-4 border-t">
                 <h3 className="font-semibold text-center text-green-600">All participants have paid!</h3>
                <p className="text-sm text-center text-muted-foreground">You can now upload the proof of purchase.</p>
                <Input 
                    type="file" 
                    onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)}
                    disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={!uploadedFile || isSubmitting || isUploading}
                  className="w-full"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload Proof & Complete'}
                </Button>
            </form>
        ) : (
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                Waiting for all participants to complete their payment.
            </div>
        )}
      </CardContent>
    </Card>
  );
} 