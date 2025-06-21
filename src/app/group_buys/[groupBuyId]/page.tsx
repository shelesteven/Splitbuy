"use client";

import { useEffect, useState } from "react";
import { allProducts } from "@/lib/products";
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

export default function GroupBuyPage() {
  const params = useParams();
  const { authUser } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [product, setProduct] = useState<any>(null);
  const groupBuyId = Array.isArray(params.groupBuyId) ? params.groupBuyId[0] : params.groupBuyId;

  useEffect(() => {
    const currentProduct = allProducts.find((p) => p.id === groupBuyId);
    if (!currentProduct) {
      notFound();
    }
    setProduct(currentProduct);
  }, [groupBuyId]);

  useEffect(() => {
    if (!authUser || !groupBuyId) return;

    const setupChatAndParticipants = async () => {
      const chatRef = doc(db, "chats", groupBuyId);
      const chatSnap = await getDoc(chatRef);

      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const userIds = chatData.users || [];
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
    };

    if (product) {
        setupChatAndParticipants();
    }
  }, [authUser, groupBuyId, product]);

  if (!product) {
    return <div>Loading...</div>;
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
                <span className="text-xl font-bold text-green-500">{product.discountedPrice}</span>
                <span className="text-lg text-muted-foreground line-through">{product.price}</span>
            </div>
            <Button size="lg" className="w-fit">Buy</Button>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-y-4 lg:h-full">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
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
            </CardContent>
          </Card>
          <div className="flex-grow min-h-0">
            {groupBuyId && <ChatBox chatId={groupBuyId} />}
          </div>
        </div>
      </div>
    </div>
  );
} 