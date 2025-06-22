import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

interface Participant {
  userId: string;
  paid: boolean;
  paidAt?: Timestamp;
}

interface PaymentConfirmationProps {
  groupBuyId: string;
  userId: string;
  amount: number;
  onPaymentConfirmed?: () => void;
}

export function PaymentConfirmation({ 
  groupBuyId, 
  userId, 
  amount, 
  onPaymentConfirmed 
}: PaymentConfirmationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    
    try {
      const groupBuyRef = doc(db, "groupBuys", groupBuyId);
      const groupBuySnap = await getDoc(groupBuyRef);

      if (!groupBuySnap.exists()) {
        throw new Error("Group buy not found. This should not happen.");
      }

      const groupBuyData = groupBuySnap.data();
      const participants = groupBuyData.purchaseRequest?.participants || [];

      const updatedParticipants = participants.map((p: Participant) => {
        if (p.userId === userId) {
          return { ...p, paid: true, paidAt: Timestamp.now() };
        }
        return p;
      });

      await updateDoc(groupBuyRef, {
        "purchaseRequest.participants": updatedParticipants,
      });

      toast.success('Payment confirmed successfully!');
      onPaymentConfirmed?.();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to confirm payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Confirm Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">
            Amount to Pay: ${amount.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Please confirm that you have paid your share to the organizer. 
            The organizer will only be able to upload proof of purchase after everyone has confirmed their payment.
          </p>
        </div>
        
        <Button
          onClick={handleConfirmPayment}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            'Confirming...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 