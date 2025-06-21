"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthUserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ChatBoxProps {
    chatId: string;
}

interface UserData {
    [key: string]: string;
}

export function ChatBox({ chatId }: ChatBoxProps) {
    const { authUser } = useAuth();
    const [chat, setChat] = useState<any>(null);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<UserData>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };
        scrollToBottom();
    }, [chat?.messages]);

    useEffect(() => {
        if (chatId) {
            const chatDocRef = doc(db, "chats", chatId as string);
            const unsubscribe = onSnapshot(chatDocRef, async (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const chatData = docSnapshot.data();
                    setChat({ id: docSnapshot.id, ...chatData });

                    if (chatData.users) {
                        const userIds = chatData.users;
                        const usersData: UserData = { ...users };
                        for (const userId of userIds) {
                            if (!usersData[userId]) {
                                const userDocRef = doc(db, "users", userId);
                                const userDoc = await getDoc(userDocRef);
                                if (userDoc.exists()) {
                                    const userData = userDoc.data();
                                    if (userData) {
                                        usersData[userId] = userData.name;
                                    }
                                }
                            }
                        }
                        setUsers(usersData);
                    }
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

    if (!chat) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                <p className="text-gray-500">Loading chat...</p>
            </div>
        );
    }

    return (
        <Card className="w-full h-full flex flex-col">
            <div className="px-4 pb-4 border-b">
                <h2 className="text-xl font-bold">Chat</h2>
                {chat.users && <div className="text-sm text-gray-600 mt-1">Participants: {chat.users.map((uid: string) => users[uid] || "Loading...").join(", ")}</div>}
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {chat.messages.map((message: any, index: number) => (
                    <div key={index} className={`flex mb-2 ${message.senderId === authUser?.uid ? "justify-end" : "justify-start"}`}>
                        <div className={`p-2 rounded-lg ${message.senderId === authUser?.uid ? "bg-blue-500 text-white" : "bg-neutral-200 dark:bg-neutral-800"}`}>
                            {message.senderId !== authUser?.uid && <p className="text-sm font-semibold">{users[message.senderId] || "Unknown User"}</p>}
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="px-4 pt-4 border-t">
                <div className="flex gap-2">
                    <Input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} />
                    <Button onClick={handleSendMessage}>Send</Button>
                </div>
            </div>
        </Card>
    );
}
