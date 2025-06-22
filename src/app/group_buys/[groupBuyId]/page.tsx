"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Users, DollarSign } from "lucide-react";
import { ChatBox } from "@/components/chat/ChatBox";
import { useAuth } from "@/context/AuthUserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { RequirePaymentMethod } from "@/components/RequirePaymentMethod";
import { PurchaseRequestForm } from "@/components/PurchaseRequestForm";
import { PurchaseProofUpload } from "@/components/PaymentUpload";
import { PurchaseApproval } from "@/components/PurchaseApproval";
import { PaymentManagement } from "@/components/PaymentManagement";
import { toast } from "sonner";
import { type } from "os";

interface Participant {
  userId: string;
  status: 'confirmed' | 'pending';
  joinedAt: Timestamp;
}

interface JoinRequest {
  userId: string;
  requestedAt: Timestamp;
}

interface PurchaseRequest {
  id: string;
  organizerId: string;
  amount: number;
  deadline: Date;
  message: string;
  status: 'awaiting_organizer_proof' | 'awaiting_participant_approval' | 'completed';
  createdAt: Timestamp;
  organizerProof?: string | null;
  organizerProofUploadedAt?: Timestamp | null;
  participants: {
    userId: string;
    status: 'awaiting_organizer_proof' | 'awaiting_approval' | 'approved' | 'rejected';
    approvedAt?: Timestamp;
  }[];
}

interface GroupBuy {
  listingId: string;
  organizer: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  joinRequests: JoinRequest[];
  status: 'open' | 'full' | 'purchasing' | 'completed';
  purchaseRequest?: PurchaseRequest;
}

interface Product {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    discountedPrice: number;
    pricePerUnit: number;
}

interface UserProfile {
    name: string;
}

// Fix protocol-relative URLs to absolute URLs
const fixImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/placeholder-product.svg";
  if (url === "/placeholder-product.svg") return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
};

export default function GroupBuyPage() {
  const params = useParams();
  const { authUser } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [groupBuy, setGroupBuy] = useState<GroupBuy | null>(null);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: UserProfile}>({});
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  
  const groupBuyId = Array.isArray(params.groupBuyId) ? params.groupBuyId[0] : params.groupBuyId;

  // Check user's status in the group buy
  const getUserStatus = () => {
    if (!authUser || !groupBuy) return 'none';
    
    if (groupBuy.organizer === authUser.uid) return 'organizer';
    
    const participant = groupBuy.participants.find(p => p.userId === authUser.uid);
    if (participant) return 'participant';
    
    const request = groupBuy.joinRequests.find(r => r.userId === authUser.uid);
    if (request) return 'requested';
    
    return 'none';
  };

  const canJoin = () => {
    if (!groupBuy) return false;
    return groupBuy.status === 'open' && 
           groupBuy.currentParticipants < groupBuy.maxParticipants &&
           getUserStatus() === 'none';
  };

  const canViewChat = () => {
    const status = getUserStatus();
    return status === 'organizer' || status === 'participant';
  };

  const canSendPurchaseRequest = () => {
    const status = getUserStatus();
    return status === 'organizer' && 
           groupBuy?.status === 'full' && 
           !groupBuy?.purchaseRequest;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!groupBuyId) return;
      
      try {
        // Fetch product/listing
        const productDoc = await getDoc(doc(db, "listings", groupBuyId));
        if (!productDoc.exists()) {
          notFound();
        }
        
        const productData = productDoc.data() as Omit<Product, 'id' | 'imageUrl'> & { image?: string };
        setProduct({
          ...productData,
          id: productDoc.id,
          imageUrl: fixImageUrl(productData.image),
        });

        // Fetch group buy data
        const groupBuyDoc = await getDoc(doc(db, "groupBuys", groupBuyId));
        if (groupBuyDoc.exists()) {
          const groupBuyData = groupBuyDoc.data() as GroupBuy;
          setGroupBuy(groupBuyData);

          // Fetch user profiles for all participants and requests
          const allUserIds = [
            ...groupBuyData.participants.map(p => p.userId),
            ...groupBuyData.joinRequests.map(r => r.userId),
            groupBuyData.organizer
          ];
          
          const uniqueUserIds = [...new Set(allUserIds)];
          const profilePromises = uniqueUserIds.map(async (userId) => {
            const profileDoc = await getDoc(doc(db, "profiles", userId));
            return { userId, data: profileDoc.exists() ? profileDoc.data() : null };
          });
          
          const profiles = await Promise.all(profilePromises);
          const profilesMap = profiles.reduce((acc, { userId, data }) => {
            if (data) {
                acc[userId] = data as UserProfile;
            }
            return acc;
          }, {} as {[key: string]: UserProfile});
          
          setUserProfiles(profilesMap);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupBuyId]);

  const handleJoinRequest = async () => {
    if (!authUser || !groupBuy || !canJoin() || !groupBuyId) return;
    
    setIsJoining(true);
    try {
      await updateDoc(doc(db, "groupBuys", groupBuyId), {
        joinRequests: arrayUnion({
          userId: authUser.uid,
          requestedAt: Timestamp.now(),
        })
      });
      
      // Update local state
      setGroupBuy(prev => prev ? {
        ...prev,
        joinRequests: [...prev.joinRequests, {
          userId: authUser.uid,
          requestedAt: Timestamp.now(),
        }]
      } : null);
      
      toast.success("Join request sent!");
    } catch (error) {
      console.error("Error sending join request:", error);
      toast.error("Failed to send join request");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRequestResponse = async (userId: string, approve: boolean) => {
    if (!authUser || !groupBuy || groupBuy.organizer !== authUser.uid || !groupBuyId) return;
    
    try {
      if (approve) {
        const newParticipantCount = groupBuy.currentParticipants + 1;
        const newStatus = newParticipantCount >= groupBuy.maxParticipants ? 'full' : 'open';
        
        // Add to participants and remove from requests
        await updateDoc(doc(db, "groupBuys", groupBuyId), {
          participants: arrayUnion({
            userId: userId,
            status: "confirmed",
            joinedAt: Timestamp.now(),
          }),
          joinRequests: arrayRemove(groupBuy.joinRequests.find(r => r.userId === userId)),
          currentParticipants: newParticipantCount,
          status: newStatus,
        });

        // Add user to chat
        await updateDoc(doc(db, "chats", groupBuyId), {
          users: arrayUnion(userId),
        });

        toast.success("User approved and added to group!");
      } else {
        // Just remove from requests (silent rejection)
        await updateDoc(doc(db, "groupBuys", groupBuyId), {
          joinRequests: arrayRemove(groupBuy.joinRequests.find(r => r.userId === userId)),
        });
      }
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error handling join request:", error);
      toast.error("Failed to process request");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product || !groupBuy || !groupBuyId) {
    return <div>Group buy not found</div>;
  }

  const userStatus = getUserStatus();
  
  return (
    <RequirePaymentMethod>
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
                <span className="text-xl font-bold text-green-500">
                  ${product.discountedPrice?.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  ${product.pricePerUnit?.toFixed(2)}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                Created by{" "}
                <Link href={`/profile/${groupBuy.organizer}`} className="text-blue-500 hover:underline">
                  {userProfiles[groupBuy.organizer]?.name || "Unknown User"}
                </Link>
              </div>

              {/* Group Status */}
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  {groupBuy.currentParticipants}/{groupBuy.maxParticipants} participants
                </span>
                {groupBuy.status === 'full' && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    FULL
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              {userStatus === 'organizer' && (
                <div className="flex gap-2 mb-2">
                  {canSendPurchaseRequest() && (
                    <Button 
                      size="lg" 
                      onClick={() => setShowPurchaseForm(!showPurchaseForm)}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Send Purchase Request
                    </Button>
                  )}
                  {groupBuy?.status === 'purchasing' && (
                    <Button size="lg" variant="outline" disabled>
                      Managing Payments
                    </Button>
                  )}
                  {groupBuy?.status === 'completed' && (
                    <Button size="lg" variant="outline" disabled>
                      ✅ Completed
                    </Button>
                  )}
                </div>
              )}
              {userStatus === 'participant' && groupBuy?.status === 'open' && (
                <Button size="lg" className="w-fit mb-2" disabled>
                  You&apos;re in this group!
                </Button>
              )}
              {userStatus === 'requested' && (
                <Button size="lg" className="w-fit mb-2" disabled>
                  <Clock className="h-4 w-4 mr-2" />
                  Request Pending
                </Button>
              )}
              {userStatus === 'none' && (
                <Button 
                  size="lg" 
                  className="w-fit mb-2"
                  onClick={handleJoinRequest}
                  disabled={!canJoin() || isJoining}
                >
                  {canJoin() ? 'Request to Join' : 'Cannot Join'}
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-y-4 lg:h-full overflow-y-auto">
            {/* Purchase Request Form (organizer only) */}
            {userStatus === 'organizer' && showPurchaseForm && canSendPurchaseRequest() && (
              <PurchaseRequestForm
                groupBuyId={groupBuyId}
                organizerId={authUser!.uid}
                productPrice={product.discountedPrice}
                participantCount={groupBuy.maxParticipants}
                productName={product.name}
                onSuccess={() => {
                  setShowPurchaseForm(false);
                  window.location.reload();
                }}
              />
            )}

            {/* Purchase Proof Upload (organizer during purchasing - awaiting proof) */}
            {userStatus === 'organizer' && groupBuy.status === 'purchasing' && groupBuy.purchaseRequest && 
             groupBuy.purchaseRequest.status === 'awaiting_organizer_proof' && (
              <PurchaseProofUpload
                groupBuyId={groupBuyId}
                organizerId={authUser!.uid}
                amount={groupBuy.purchaseRequest.amount}
                deadline={new Date(groupBuy.purchaseRequest.deadline)}
                currentProof={groupBuy.purchaseRequest.organizerProof}
                onUploadSuccess={() => window.location.reload()}
              />
            )}

            {/* Payment Management (organizer during purchasing - after proof uploaded) */}
            {userStatus === 'organizer' && groupBuy.status === 'purchasing' && groupBuy.purchaseRequest && 
             groupBuy.purchaseRequest.status !== 'awaiting_organizer_proof' && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Participant Approval Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupBuy.purchaseRequest.participants.map((participant) => (
                      <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {participant.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : participant.status === 'rejected' ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              <Link href={`/profile/${participant.userId}`} className="hover:underline">
                                {userProfiles[participant.userId]?.name || "Unknown User"}
                              </Link>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {participant.status === 'approved' ? 'Approved' : 
                               participant.status === 'rejected' ? 'Rejected' : 
                               'Awaiting approval'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Purchase Approval (participants during purchasing) */}
            {userStatus === 'participant' && groupBuy.status === 'purchasing' && groupBuy.purchaseRequest && 
             groupBuy.purchaseRequest.organizerProof && (() => {
              const participantStatus = groupBuy.purchaseRequest.participants.find(p => p.userId === authUser!.uid);
              const validStatus = participantStatus?.status === 'awaiting_organizer_proof' ? 'awaiting_approval' : 
                                 (participantStatus?.status || 'awaiting_approval');
              return (
                <PurchaseApproval
                  groupBuyId={groupBuyId}
                  userId={authUser!.uid}
                  purchaseRequest={{
                    amount: groupBuy.purchaseRequest.amount,
                    organizerProof: groupBuy.purchaseRequest.organizerProof || '',
                    organizerProofUploadedAt: groupBuy.purchaseRequest.organizerProofUploadedAt?.toDate().toISOString() || ''
                  }}
                  userStatus={validStatus as 'awaiting_approval' | 'approved' | 'rejected'}
                  onUpdate={() => window.location.reload()}
                />
              );
            })()}

            {/* Waiting for organizer proof */}
            {userStatus === 'participant' && groupBuy.status === 'purchasing' && groupBuy.purchaseRequest && 
             !groupBuy.purchaseRequest.organizerProof && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">⏳ Waiting for Purchase</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The organizer is preparing to purchase the items. You&apos;ll be able to review and approve the purchase proof once it&apos;s uploaded.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Participants Card */}
            {groupBuy.status !== 'purchasing' && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg">Participants</CardTitle>
                </CardHeader>
                <CardContent className="py-1">
                  <ul className="space-y-1">
                    {groupBuy.participants.map((participant) => (
                      <li key={participant.userId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            <Link href={`/profile/${participant.userId}`} className="hover:underline">
                              {userProfiles[participant.userId]?.name || "Unknown User"}
                            </Link>
                            {participant.userId === groupBuy.organizer && " (Organizer)"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Join Requests (only visible to organizer) */}
            {userStatus === 'organizer' && groupBuy.joinRequests.length > 0 && groupBuy.status !== 'purchasing' && (
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-lg">Join Requests</CardTitle>
                </CardHeader>
                <CardContent className="py-1">
                  <ul className="space-y-2">
                    {groupBuy.joinRequests.map((request) => (
                      <li key={request.userId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <Link href={`/profile/${request.userId}`} className="hover:underline">
                            {userProfiles[request.userId]?.name || "Unknown User"}
                          </Link>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleJoinRequestResponse(request.userId, true)}
                          >
                            ✓
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleJoinRequestResponse(request.userId, false)}
                          >
                            ✗
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Chat */}
            {groupBuy.status !== 'purchasing' && (
              <div className="flex-grow min-h-0">
                {canViewChat() ? (
                  <ChatBox chatId={groupBuyId} />
                ) : (
                  <Card className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">
                      {userStatus === 'requested' 
                        ? "You'll be able to chat once approved" 
                        : "Join the group to access chat"
                      }
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RequirePaymentMethod>
  );
} 