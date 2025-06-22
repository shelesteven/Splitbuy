"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { ChatBox } from "@/components/chat/ChatBox";
import { useAuth } from "@/context/AuthUserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";

interface Participant {
  id: string;
  name: string;
  status: 'confirmed' | 'pending';
}

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

export default function GroupBuyPage() {
  const params = useParams();
  const { authUser } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const [loading, setLoading] = useState(true);
  const groupBuyId = Array.isArray(params.groupBuyId) ? params.groupBuyId[0] : params.groupBuyId;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!groupBuyId) return;
      
      try {
        const productDoc = await getDoc(doc(db, "listings", groupBuyId));
        if (!productDoc.exists()) {
          notFound();
        }
        
        const productData = productDoc.data();
        setProduct({
          id: productDoc.id,
          ...productData,
          imageUrl: fixImageUrl(productData.image), // Map the image field to imageUrl with fallback
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [groupBuyId]);

  useEffect(() => {
    if (!authUser || !groupBuyId || !product) return;

    const setupChatAndParticipants = async () => {
      try {
        const chatRef = doc(db, "chats", groupBuyId);
        const chatSnap = await getDoc(chatRef);
  
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const userIds = chatData.users || [];
          // Simple permission check: if authUser is not in the list, they can't see it.
          if (!userIds.includes(authUser.uid)) {
            setHasPermission(false);
            return;
          }
          setHasPermission(true);
          const userPromises = userIds.map((uid: string) => getDoc(doc(db, "users", uid)));
          const userDocs = await Promise.all(userPromises);
          const fetchedParticipants = userDocs.map(userDoc => {
            const userData = userDoc.data();
            return {
              id: userDoc.id,
              name: userData?.name || "Anonymous",
              status: "confirmed",
            } as Participant;
          });
          setParticipants(fetchedParticipants);
        } else {
          // If the chat doesn't exist, we assume the user can create one
          setHasPermission(true);
          const userDocRef = doc(db, "users", authUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const currentUserName = userDocSnap.data()?.name || authUser.email || "Current User";
  
          const usersRef = collection(db, "users");
          const usersSnap = await getDocs(usersRef);
          const allUsers = usersSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => user.id !== authUser.uid);
    
          const randomUsers = allUsers.sort(() => 0.5 - Math.random()).slice(0, 2);
          
          const currentUserInfo = { id: authUser.uid, name: currentUserName, status: "confirmed" as const };
          
          const newParticipants = [
            currentUserInfo,
            ...randomUsers.map(user => ({ id: user.id, name: (user as any).name || "Anonymous", status: "confirmed" as const}))
          ];
          
          setParticipants(newParticipants);
    
          const participantIds = newParticipants.map(p => p.id);
    
          await setDoc(chatRef, {
            users: participantIds,
            createdAt: serverTimestamp(),
            messages: [
              {
                senderId: randomUsers[0]?.id || 'system',
                text: `Hey everyone, what do you think of this ${product?.name}?`,
                timestamp: Timestamp.now(),
              },
              {
                senderId: authUser.uid,
                text: "I think it's a great deal!",
                timestamp: Timestamp.now(),
              },
            ],
          });
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          setHasPermission(false);
        } else {
          console.error("Error setting up chat and participants:", error);
        }
      }
    };

    setupChatAndParticipants();
  }, [authUser, groupBuyId, product]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }
  
  return (
    <div className="px-16 py-4 md:py-6 lg:py-8 lg:h-[calc(100vh-100px)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-full">
        <div className="lg:col-span-2 lg:h-full flex flex-col gap-y-4">
          <div className="relative w-full aspect-video lg:h-3/5 lg:aspect-auto">
            <Image
              src={product.imageUrl}
              alt={product.name}
              layout="fill"
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex-grow px-2 flex flex-col justify-start">
            <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
            <p className="text-muted-foreground mb-2 text-sm">
              {product.description}
            </p>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-xl font-bold text-green-500">${product.discountedPrice?.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground line-through">${product.pricePerUnit?.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-fit">
              {hasPermission ? 'Buy' : 'Request to Join'}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-y-4 lg:h-full">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              {hasPermission ? (
                <ul className="space-y-1">
                  {participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {participant.status === "confirmed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{participant.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You do not have permission to view the participants.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="flex-grow min-h-0">
            {hasPermission && groupBuyId && <ChatBox chatId={groupBuyId} />}
          </div>
        </div>
      </div>
    </div>
  );
} 