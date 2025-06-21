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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={400}
                    height={400}
                    className="rounded-lg object-cover w-full aspect-square"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                  <p className="text-muted-foreground mb-4">
                    {product.description}
                  </p>
                  <Button size="lg">Buy</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {participant.status === "confirmed" ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      <span className="font-medium">{participant.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {groupBuyId && <ChatBox chatId={groupBuyId} />}
        </div>
      </div>
    </div>
  );
} 