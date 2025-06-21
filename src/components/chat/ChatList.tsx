"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthUserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface ChatListProps {
    onSelectChat: (chatId: string) => void;
}

interface UserData {
    [key: string]: string;
}

export function ChatList({ onSelectChat }: ChatListProps) {
    const { authUser } = useAuth();
    const [chats, setChats] = useState<any[]>([]);
    const [users, setUsers] = useState<UserData>({});
    const [newChatUserEmails, setNewChatUserEmails] = useState<string[]>([""]);

    useEffect(() => {
        if (!authUser) return;

        const q = query(collection(db, "chats"), where("users", "array-contains", authUser.uid));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const chatsData = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return { id: doc.id, users: data.users || [] };
            });
            setChats(chatsData);

            // Collect all unique user IDs from all chats
            const allUserIds = new Set<string>();
            chatsData.forEach((chat) => {
                if (chat.users) {
                    chat.users.forEach((userId: string) => {
                        allUserIds.add(userId);
                    });
                }
            });

            // Fetch user data for all user IDs
            if (allUserIds.size > 0) {
                const usersData: UserData = {};
                await Promise.all(
                    Array.from(allUserIds).map(async (userId) => {
                        const userDocRef = doc(db, "users", userId);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            usersData[userId] = userData?.name || "Unknown User";
                        }
                    })
                );
                setUsers(usersData);
            }
        });

        return () => unsubscribe();
    }, [authUser]);

    const addEmailInput = () => {
        setNewChatUserEmails([...newChatUserEmails, ""]);
    };

    const removeEmailInput = (index: number) => {
        if (newChatUserEmails.length > 1) {
            setNewChatUserEmails(newChatUserEmails.filter((_, i) => i !== index));
        }
    };

    const updateEmailInput = (index: number, value: string) => {
        const updated = [...newChatUserEmails];
        updated[index] = value;
        setNewChatUserEmails(updated);
    };

    const createNewChat = async () => {
        if (!authUser) return;

        // Filter out empty emails and validate
        const validEmails = newChatUserEmails.filter((email) => email.trim() !== "");
        if (validEmails.length === 0) {
            alert("Please enter at least one email address.");
            return;
        }

        // Check if user is trying to invite themselves
        if (authUser.email && validEmails.some((email) => email.toLowerCase() === authUser.email?.toLowerCase())) {
            alert("You cannot invite yourself to a chat.");
            return;
        }

        try {
            // Find all users by email
            const userQueries = validEmails.map((email) => query(collection(db, "users"), where("email", "==", email)));

            const queryResults = await Promise.all(userQueries.map((q) => getDocs(q)));
            const foundUsers: string[] = [];
            const notFoundEmails: string[] = [];

            validEmails.forEach((email, index) => {
                if (!queryResults[index].empty) {
                    foundUsers.push(queryResults[index].docs[0].id);
                } else {
                    notFoundEmails.push(email);
                }
            });

            if (notFoundEmails.length > 0) {
                alert(`Users not found: ${notFoundEmails.join(", ")}`);
                return;
            }

            // Check if a chat with this exact set of users already exists
            const allUsers = [authUser.uid, ...foundUsers].sort();
            const existingChatQuery = query(collection(db, "chats"), where("users", "array-contains", authUser.uid));
            const existingChatSnapshot = await getDocs(existingChatQuery);

            const existingChat = existingChatSnapshot.docs.find((doc) => {
                const chatUsers = [...doc.data().users].sort();
                return JSON.stringify(chatUsers) === JSON.stringify(allUsers);
            });

            if (existingChat) {
                onSelectChat(existingChat.id);
                setNewChatUserEmails([""]);
                return;
            }

            // Create new chat with all users
            const chatRef = await addDoc(collection(db, "chats"), {
                users: allUsers,
                messages: [],
                createdAt: new Date().toISOString(),
            });

            onSelectChat(chatRef.id);
            setNewChatUserEmails([""]);
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Failed to create chat. Please try again.");
        }
    };

    return (
        <Card className="w-full h-full flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold">Chats</h2>
                <div className="mt-4 space-y-2">
                    {newChatUserEmails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                            <Input type="email" placeholder={`Enter user email ${index + 1}`} value={email} onChange={(e) => updateEmailInput(index, e.target.value)} />
                            {newChatUserEmails.length > 1 && (
                                <Button variant="outline" onClick={() => removeEmailInput(index)} className="px-3">
                                    ×
                                </Button>
                            )}
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <Button onClick={addEmailInput} variant="outline" className="flex-1">
                            + Add User
                        </Button>
                        <Button onClick={createNewChat} className="flex-1">
                            Create Chat
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {chats.map((chat) => {
                    const otherUserIds = chat.users.filter((uid: string) => uid !== authUser?.uid);
                    const otherUserNames = otherUserIds.map((uid: string) => users[uid] || "Loading...").join(", ");
                    const displayName = otherUserNames || "Group Chat";
                    return (
                        <div key={chat.id} onClick={() => onSelectChat(chat.id)} className="p-2 border-b cursor-pointer">
                            <p className="font-semibold">{displayName}</p>
                            <p className="text-sm text-gray-500">
                                {chat.users.length} member{chat.users.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
