"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthUserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface ChatBoxProps {
    chatId: string;
}

interface UserData {
    [key: string]: string;
}

interface ChatMessage {
    senderId: string;
    text: string;
    timestamp: Timestamp;
}

interface Chat {
    id: string;
    users: string[];
    messages: ChatMessage[];
}

export function ChatBox({ chatId }: ChatBoxProps) {
    const { authUser } = useAuth();
    const [chat, setChat] = useState<Chat | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [users, setUsers] = useState<UserData>({});
    const [error, setError] = useState<string | null>(null);
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
                    setError(null);
                    const chatData = docSnapshot.data() as Omit<Chat, 'id'>;
                    setChat({ id: docSnapshot.id, ...chatData });

                    if (chatData.users) {
                        const userIds = chatData.users;
                        const usersData: UserData = {};
                        for (const userId of userIds) {
                            const profileDocRef = doc(db, "profiles", userId);
                            const profileDoc = await getDoc(profileDocRef);
                            if (profileDoc.exists()) {
                                const profileData = profileDoc.data();
                                if (profileData) {
                                    usersData[userId] = profileData.name;
                                }
                            }
                        }
                        setUsers(usersData);
                    }
                }
            }, (err) => {
                if (err.code === 'permission-denied') {
                    setError("No permission to view this chat.");
                    setChat(null);
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
                timestamp: Timestamp.now(),
            }),
        });

        setNewMessage("");
    };

    if (error) {
        return null;
    }

    if (!chat) {
        return (
            <Card className="flex items-center justify-center h-full">
                <p>Loading chat...</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-full">
            <div className="px-4 pb-4 border-b flex-shrink-0">
                <h2 className="text-xl font-bold">Chat</h2>
                {chat.users && <div className="text-sm text-gray-600 mt-1">Participants: {chat.users.map((uid: string, index: number) => (
                    <span key={uid}>
                        <Link href={`/profile/${uid}`} className="text-blue-500 hover:underline">
                            {users[uid] || "Loading..."}
                        </Link>
                        {index < chat.users.length - 1 && ", "}
                    </span>
                ))}</div>}
            </div>
            <div className="flex-grow min-h-0 overflow-auto">
                <div className="p-4">
                    {chat.messages.map((message: ChatMessage, index: number) => {
                        const isSystemMessage = message.senderId === "system";
                        const isOwnMessage = message.senderId === authUser?.uid;
                        
                        if (isSystemMessage) {
                            return (
                                <div key={index} className="flex justify-center mb-2">
                                    <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                                        {message.text}
                                    </div>
                                </div>
                            );
                        }
                        
                        return (
                            <div key={index} className={`flex mb-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                <div className={`p-2 rounded-lg max-w-xs ${isOwnMessage ? "bg-blue-500 text-white" : "bg-neutral-200 dark:bg-neutral-800"}`}>
                                    {!isOwnMessage && (
                                        <p className="text-sm font-semibold mb-1">
                                            <Link href={`/profile/${message.senderId}`} className="hover:underline">
                                                {users[message.senderId] || "Unknown User"}
                                            </Link>
                                        </p>
                                    )}
                                    <p className="break-words">{message.text}</p>
                                    <p className="text-xs opacity-70 mt-1">
                                        {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="px-4 pt-4 border-t flex-shrink-0">
                <div className="flex gap-2">
                    <Input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} />
                    <Button onClick={handleSendMessage}>Send</Button>
                </div>
            </div>
        </Card>
    );
}
