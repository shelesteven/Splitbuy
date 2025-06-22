"use client";

import { useAuth } from "@/context/AuthUserContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PageContainer } from "@/components/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { RequirePaymentMethod } from "@/components/RequirePaymentMethod";

// Fix protocol-relative URLs to absolute URLs
const fixImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder-product.svg";
  
  // If it's already a placeholder, return as is
  if (url === "/placeholder-product.svg") return url;
  
  // If it's a protocol-relative URL (starts with //), convert to https://
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  
  // If it's already an absolute URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // If it's a relative URL, return as is
  return url;
};

export type ListingData = {
  name: string;
  category: string;
  description: string;
  discountDescription: string;
  pricePerUnit: number;
  discountedPrice: number;
  image: string;
  url: string;
  minPeople: number;
  maxPeople: number;
  token: string;
};

export default function CreateListingPage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [listingData, setListingData] = useState<Partial<ListingData>>({});
  const [numberOfPeople, setNumberOfPeople] = useState([2]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace("/sign-in");
    }
  }, [authUser, loading, router]);

  const handleUrlSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep(2);
    setError(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: listingData.url }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setListingData({
        ...listingData,
        ...data,
      });
      setNumberOfPeople([data.minPeople || 2]);
      setStep(3);
    } catch (error: unknown) {
      console.error("Failed to scrape URL:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setStep(1);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      setError("You must be logged in to create a listing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: listingData.token,
          name: listingData.name,
          url: listingData.url,
          numberOfPeople: numberOfPeople[0],
          userId: authUser.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing.");
      }

      // Redirect to the newly created group buy page
      router.push(`/group_buys/${data.listingId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred while creating the listing.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <RequirePaymentMethod>
      <PageContainer>
        <div className="flex justify-center items-center h-full">
          {step === 1 && (
            <div className="w-full max-w-2xl fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Create a new listing</CardTitle>
                  <CardDescription>
                    Enter a product page URL with a discount to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4">
                    <Input
                      type="url"
                      placeholder="https://example.com/product/widget-pro"
                      value={listingData.url || ""}
                      onChange={(e) =>
                        setListingData({ ...listingData, url: e.target.value })
                      }
                      required
                    />
                    {error && (
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                    <Button type="submit" className="w-full">
                      Analyze
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-2xl fade-in">
              <h2 className="text-2xl font-semibold text-center mb-4">
                Analyzing URL, please wait...
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <Skeleton className="h-64 w-64 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="w-full max-w-2xl fade-in">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Listing</CardTitle>
                  <CardDescription>
                    Review and adjust the information below. You can edit the product name and number of people for the group buy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {listingData.image && (
                    <div className="flex justify-center mb-8 h-80">
                      <Image
                        src={fixImageUrl(listingData.image)}
                        alt={listingData.name || "Product image"}
                        width={400}
                        height={400}
                        className="rounded-lg object-contain h-full w-auto"
                      />
                    </div>
                  )}
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                        Name
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                          Editable
                        </span>
                      </Label>
                      <Input
                        id="name"
                        value={listingData.name || ""}
                        onChange={(e) =>
                          setListingData({ ...listingData, name: e.target.value })
                        }
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="flex items-center gap-2 mb-2">
                        Category
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                          Auto-detected
                        </span>
                      </Label>
                      <Input
                        id="category"
                        value={listingData.category || ""}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="flex items-center gap-2 mb-2">
                        Description
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                          Auto-detected
                        </span>
                      </Label>
                      <Textarea
                        id="description"
                        value={listingData.description || ""}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountDescription" className="flex items-center gap-2 mb-2">
                        Discount Details
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                          Auto-detected
                        </span>
                      </Label>
                      <Textarea
                        id="discountDescription"
                        value={listingData.discountDescription || ""}
                        readOnly
                        className="bg-gray-50 dark:bg-gray-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pricePerUnit" className="flex items-center gap-2 mb-2">
                          Original Price
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                            Auto-detected
                          </span>
                        </Label>
                        <Input
                          id="pricePerUnit"
                          type="number"
                          value={listingData.pricePerUnit || ""}
                          readOnly
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <Label htmlFor="discountedPrice" className="flex items-center gap-2 mb-2">
                          Discounted Price
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                            Auto-detected
                          </span>
                        </Label>
                        <Input
                          id="discountedPrice"
                          type="number"
                          value={listingData.discountedPrice || ""}
                          readOnly
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="numberOfPeople" className="flex items-center gap-2 mb-2">
                        Number of people for group buy
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                          Editable
                        </span>
                      </Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          id="numberOfPeople"
                          min={listingData.minPeople || 2}
                          max={listingData.maxPeople || 100}
                          step={1}
                          value={numberOfPeople}
                          onValueChange={setNumberOfPeople}
                        />
                        <span className="font-bold text-lg">
                          {numberOfPeople[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end items-center space-x-2 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        disabled={isSubmitting}
                      >
                        Reject
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Accept and Create Listing"
                        )}
                      </Button>
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm mt-2 text-right">
                        {error}
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>
    </RequirePaymentMethod>
  );
}
