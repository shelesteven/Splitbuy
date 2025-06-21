"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthUserContext";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ChatRoomPage() {
    const { authUser, loading } = useAuth();
    const router = useRouter();
    const { chatId } = useParams();
    const [chat, setChat] = useState<any>(null);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        if (!loading && !authUser) {
            router.push("/sign-in");
        }
    }, [authUser, loading, router]);

    useEffect(() => {
        if (chatId) {
            const chatDocRef = doc(db, "chats", chatId as string);

            const unsubscribe = onSnapshot(chatDocRef, (doc) => {
                if (doc.exists()) {
                    setChat({ id: doc.id, ...doc.data() });
                }
            });

            return () => unsubscribe();
        }
    }, [chatId]);

    const handleSendMessage = async () => {
        if (!authUser || !chatId || !newMessage.trim()) return;

        const chatDocRef = doc(db, "chats", chatId as string);

        await updateDoc(chatDocRef, {
            messages: arrayUnion({
                senderId: authUser.uid,
                text: newMessage,
                timestamp: new Date().toISOString(),
            }),
        });

        setNewMessage("");
    };

    return (
        <PageContainer>
            <Card className="w-full max-w-2xl mx-auto mt-10 p-6">
                <h1 className="text-2xl font-bold mb-4">Chat Room</h1>
                <div className="flex flex-col gap-4 h-96 overflow-y-auto p-4 border rounded-md mb-4">
                    {chat?.messages.map((message: any, index: number) => (
                        <div key={index} className={`flex ${message.senderId === authUser?.uid ? "justify-end" : "justify-start"}`}>
                            <div className={`p-2 rounded-lg ${message.senderId === authUser?.uid ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
                                <p>{message.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input type="text" placeholder="Type a message" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                    <Button onClick={handleSendMessage}>Send</Button>
                </div>
            </Card>
        </PageContainer>
    );
}
