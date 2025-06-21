"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthUserContext";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
    const { authUser, loading } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<any[]>([]);
    const [newChatUserEmail, setNewChatUserEmail] = useState("");

    useEffect(() => {
        if (!loading && !authUser) {
            router.push("/sign-in");
        }
    }, [authUser, loading, router]);

    useEffect(() => {
        if (authUser) {
            const q = query(collection(db, "chats"), where("users", "array-contains", authUser.uid));
            getDocs(q).then((querySnapshot) => {
                const chatsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setChats(chatsData);
            });
        }
    }, [authUser]);

    const createNewChat = async () => {
        if (!authUser) return;

        const q = query(collection(db, "users"), where("email", "==", newChatUserEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.docs[0] === undefined) {
            alert("User not found");
            return;
        }

        const userToChatWithId = querySnapshot.docs[0].id;

        const chatRef = await addDoc(collection(db, "chats"), {
            users: [authUser.uid, userToChatWithId],
            messages: [],
        });

        router.push(`/chat/${chatRef.id}`);
    };

    return (
        <PageContainer>
            <Card className="w-full max-w-md mx-auto mt-10 p-6">
                <h1 className="text-2xl font-bold mb-4">Chats</h1>
                <div className="flex gap-2 mb-4">
                    <Input type="email" placeholder="Enter user email to chat" value={newChatUserEmail} onChange={(e) => setNewChatUserEmail(e.target.value)} />
                    <Button onClick={createNewChat}>New Chat</Button>
                </div>
                <div>
                    {chats.map((chat) => (
                        <div key={chat.id} onClick={() => router.push(`/chat/${chat.id}`)} className="p-2 border-b cursor-pointer">
                            <p>Chat with {chat.id}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </PageContainer>
    );
}
