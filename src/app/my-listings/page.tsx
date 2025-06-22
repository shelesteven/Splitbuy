"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthUserContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/PageContainer";
import { LoadingSpinner } from "@/components/ui/loading";
import { RequirePaymentMethod } from "@/components/RequirePaymentMethod";
import { useRouter } from "next/navigation";

// Utility to fix image URLs, can be moved to a shared util file
const fixImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder-product.svg";
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  discountedPrice: number;
  pricePerUnit: number;
};

// Simplified product card component for reuse
const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/group_buys/${product.id}`} key={product.id}>
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
      <div className="relative">
        <img
          src={fixImageUrl(product.image)}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-600">
              {product.discountedPrice ? `$${product.discountedPrice.toFixed(2)}` : "N/A"}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 line-through">
              {product.pricePerUnit ? `$${product.pricePerUnit.toFixed(2)}` : "N/A"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  </Link>
);

export default function MyListingsPage() {
  const { authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [myListings, setMyListings] = useState<Product[]>([]);
  const [joinedGroupBuys, setJoinedGroupBuys] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/sign-in");
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    if (!authUser) return;

    const fetchMyData = async () => {
      setDataLoading(true);

      // Fetch listings created by the user
      const listingsQuery = query(collection(db, "listings"), where("createdBy", "==", authUser.uid));
      const listingsSnapshot = await getDocs(listingsQuery);
      setMyListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));

      // Fetch group buys the user is a part of
      const groupBuysQuery = query(collection(db, "groupBuys"), where("participants", "array-contains", authUser.uid));
      const groupBuysSnapshot = await getDocs(groupBuysQuery);
      
      const groupBuyListingsPromises = groupBuysSnapshot.docs
        .filter(doc => doc.data().organizer !== authUser.uid) // Exclude buys they organized
        .map(async (doc) => {
          const groupBuy = { id: doc.id, ...doc.data() };
          const listingDoc = await getDocs(query(collection(db, "listings"), where("id", "==", groupBuy.id)));
          if (!listingDoc.empty) {
              const listingData = listingDoc.docs[0].data();
              return { ...groupBuy, ...listingData };
          }
          return null;
        });

      const joinedBuys = (await Promise.all(groupBuyListingsPromises)).filter(Boolean);
      setJoinedGroupBuys(joinedBuys as Product[]);

      setDataLoading(false);
    };

    fetchMyData();
  }, [authUser]);

  if (authLoading || dataLoading) {
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
        <div className="space-y-12">
          {/* My Listings Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">My Listings</h2>
            {myListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myListings.map((listing) => (
                  <ProductCard key={listing.id} product={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">You haven&apos;t created any listings yet.</p>
                <Link href="/create-listing">
                  <Button className="mt-4">Create Your First Listing</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Joined Group Buys Section */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">My Group Buys</h2>
            {joinedGroupBuys.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {joinedGroupBuys.map((buy) => (
                  <ProductCard key={buy.id} product={buy} />
                ))}
              </div>
            ) : (
                <div className="text-center py-10 px-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">You haven&apos;t joined any group buys yet.</p>
                    <Link href="/dashboard">
                    <Button className="mt-4">Explore Group Buys</Button>
                    </Link>
                </div>
            )}
          </section>
        </div>
      </PageContainer>
    </RequirePaymentMethod>
  );
} 