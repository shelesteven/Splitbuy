"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PurchaseRequestFormProps {
  groupBuyId: string;
  organizerId: string;
  productPrice: number;
  participantCount: number;
  productName: string;
  onSuccess?: () => void;
}

export function PurchaseRequestForm({ 
  groupBuyId, 
  organizerId, 
  productPrice, 
  participantCount, 
  productName, 
  onSuccess 
}: PurchaseRequestFormProps) {
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate amount per person
  const amountPerPerson = productPrice;
  const totalAmount = productPrice * participantCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deadline) {
      toast.error("Please select a deadline");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupBuyId,
          organizerId,
          amount: amountPerPerson,
          deadline,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send purchase request");
      }

      toast.success("Purchase request sent to all participants!");
      setDeadline("");
      setMessage("");
      onSuccess?.();
    } catch (error) {
      console.error("Error sending purchase request:", error);
      toast.error("Failed to send purchase request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Purchase Request</CardTitle>
        <p className="text-sm text-muted-foreground">
          Request payment from participants for {productName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-calculated amounts */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border dark:border-blue-900/50">
            <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Purchase Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Price per unit:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${productPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Number of participants:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{participantCount}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold text-gray-800 dark:text-gray-200 dark:border-gray-700">
                <span>Total purchase amount:</span>
                <span className="text-gray-900 dark:text-gray-100">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                <span>Amount per participant:</span>
                <span>${amountPerPerson.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="deadline">Purchase deadline *</Label>
            <Input
              id="deadline"
              type="date"
              min={today}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deadline for you to purchase the items and upload proof
            </p>
          </div>
          
          <div>
            <Label htmlFor="message">Additional message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any additional instructions or notes for participants..."
              rows={3}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Purchase Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 