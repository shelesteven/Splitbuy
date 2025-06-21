"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ChatList } from "@/components/chat/ChatList";
import { ChatBox } from "@/components/chat/ChatBox";
import { useAuth } from "@/context/AuthUserContext";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const { authUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !authUser) {
            router.push("/sign-in");
        }
    }, [authUser, loading, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!authUser) {
        router.push("/sign-in");
        return null;
    }

    return (
        <PageContainer>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                <div className="md:col-span-1">
                    <ChatList onSelectChat={setSelectedChatId} />
                </div>
                <div className="md:col-span-2">
                    {selectedChatId ? (
                        <ChatBox chatId={selectedChatId} />
                    ) : (
                        <Card className="flex items-center justify-center h-full rounded-lg">
                            <p className="text-gray-500">Select a chat to start messaging</p>
                        </Card>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
