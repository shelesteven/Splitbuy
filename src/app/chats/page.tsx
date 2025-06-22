"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ChatList } from "@/components/chat/ChatList";
import { ChatBox } from "@/components/chat/ChatBox";
import { useAuth } from "@/context/AuthUserContext";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { RequirePaymentMethod } from "@/components/RequirePaymentMethod";

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
        <RequirePaymentMethod>
            <div className="px-16 py-4 md:py-6 lg:py-8 h-[calc(100vh-100px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                    <div className="md:col-span-1 flex flex-col min-h-0">
                        <ChatList onSelectChat={setSelectedChatId} />
                    </div>
                    <div className="md:col-span-2 flex flex-col min-h-0">
                        {selectedChatId ? (
                            <ChatBox chatId={selectedChatId} />
                        ) : (
                            <Card className="flex-1 flex items-center justify-center rounded-lg">
                                <p className="text-gray-500">Select a chat to start messaging</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </RequirePaymentMethod>
    );
}
