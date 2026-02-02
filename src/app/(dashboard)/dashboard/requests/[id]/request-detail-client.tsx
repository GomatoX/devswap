"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  Wifi,
  WifiOff,
  Lock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { updateRequestStatus, sendMessage, reviseOffer } from "../actions";
import { createMatchmakingCheckout } from "../matchmaking-actions";
import { formatCurrency } from "@/lib/utils";
import { TimesheetsPanel } from "../timesheets-panel";
import { RatingDialog, RatingDisplay } from "../rating-dialog";
import { useSocket } from "@/hooks/use-socket";
import { SendOfferDialog } from "./send-offer-dialog";

type Message = {
  id: string;
  content: string;
  createdAt: Date | string;
  sender: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null; // null for system messages
};

type RequestData = {
  id: string;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  agreedRate: number | { toString: () => string } | null;
  role: string;
  currentUserId: string;
  counterparty: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  listing: {
    hourlyRate: number | { toString: () => string };
    developer: {
      pseudonym: string;
      title: string;
      level: string;
      skills: Array<{
        skill: { name: string };
        years: number;
        isPrimary: boolean;
      }>;
    };
  };
  conversation?: {
    messages: Message[];
  } | null;
  timesheets?: Array<{
    id: string;
    weekStart: Date | string;
    hours: number | { toString: () => string };
    description: string | null;
    status: string;
    createdAt: Date | string;
  }>;
  rating?: {
    id: string;
    score: number;
    comment: string | null;
    fromCompany: { id: string; name: string };
  } | null;
};

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  NEGOTIATING: { label: "Negotiating", color: "bg-orange-500", icon: Clock },
  OFFER_SENT: { label: "Offer Sent", color: "bg-indigo-500", icon: Clock },
  ACCEPTED: { label: "Accepted", color: "bg-blue-500", icon: CheckCircle },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-purple-500",
    icon: AlertCircle,
  },
  COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  REJECTED: { label: "Declined", color: "bg-red-500", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: XCircle },
};

export function RequestDetailClient({
  request,
  matchmakingFee = 500,
}: {
  request: RequestData;
  matchmakingFee?: number;
}) {
  const router = useRouter();
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    status: string;
    title: string;
    description: string;
    confirmLabel: string;
    variant?: "default" | "destructive";
  } | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get conversation ID for socket connection
  const conversationId = request.conversation ? request.id : undefined;

  // Socket.io integration for real-time chat
  const {
    isConnected,
    typingUsers: _typingUsers,
    onNewMessage,
    emitMessage,
    emitTyping,
    emitStopTyping,
  } = useSocket(conversationId);

  const status = statusConfig[request.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const rate = request.agreedRate
    ? typeof request.agreedRate === "number"
      ? request.agreedRate
      : parseFloat(request.agreedRate.toString())
    : null;

  // Combine initial messages with live messages, deduplicated by ID
  const initialMessages = request.conversation?.messages || [];
  const allMessagesMap = new Map<string, Message>();

  // Add initial messages first
  initialMessages.forEach((msg) => allMessagesMap.set(msg.id, msg));

  // Add live messages (will overwrite if duplicate, but same content)
  liveMessages.forEach((msg) => allMessagesMap.set(msg.id, msg));

  // Convert back to array and sort by createdAt
  const allMessages = Array.from(allMessagesMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const isVendor = request.role === "vendor";
  const isClient = request.role === "client";
  const canRespond =
    isVendor && ["PENDING", "NEGOTIATING"].includes(request.status);
  const canStart = isVendor && request.status === "ACCEPTED";
  const canFinalize = isClient && request.status === "OFFER_SENT";
  const [processingPayment, setProcessingPayment] = useState(false);

  // Handle matchmaking fee payment
  const handleFinalizePayment = async () => {
    setProcessingPayment(true);
    const result = await createMatchmakingCheckout(request.id);
    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
    } else {
      toast.error(result.error || "Failed to start payment");
      setProcessingPayment(false);
    }
  };
  const canComplete = request.status === "IN_PROGRESS";
  const canMessage = !["REJECTED", "CANCELLED", "COMPLETED"].includes(
    request.status,
  );

  // Handle incoming real-time messages
  const handleNewMessage = useCallback((message: Message) => {
    // Avoid duplicates
    setLiveMessages((prev) => {
      if (prev.find((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  useEffect(() => {
    onNewMessage(handleNewMessage);
  }, [onNewMessage, handleNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Restore focus after scroll - using requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [allMessages.length]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    setSending(true);

    const content = messageInput.trim();
    setMessageInput("");

    // Stop typing indicator
    emitStopTyping(request.currentUserId);

    const result = await sendMessage(request.id, content);
    if (result.success && result.data) {
      // Emit to socket for other clients (user messages always have a sender)
      if (result.data.sender) {
        emitMessage({
          id: result.data.id,
          content: result.data.content,
          senderId: result.data.sender.id,
          sender: result.data.sender,
          createdAt: new Date().toISOString(),
        });
      }
      // Add to local messages immediately
      setLiveMessages((prev) => [...prev, result.data as Message]);
    } else {
      toast.error(result.error || "Failed to send message");
      setMessageInput(content); // Restore input on error
    }
    setSending(false);
    // Keep focus on input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    // Emit typing
    emitTyping(request.currentUserId, "You");

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(request.currentUserId);
    }, 2000);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);

    // Special handling for REVISE_OFFER
    if (newStatus === "REVISE_OFFER") {
      const result = await reviseOffer(request.id);
      if (result.success) {
        toast.success("Offer withdrawn. You can now send a new offer.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to revise offer");
      }
      setUpdating(false);
      return;
    }

    const result = await updateRequestStatus(request.id, newStatus as never);
    if (result.success) {
      toast.success(`Request ${newStatus.toLowerCase()}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update status");
    }
    setUpdating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {request.listing.developer.pseudonym}
          </h1>
          <p className="text-muted-foreground">
            {request.listing.developer.title} ·{" "}
            {request.listing.developer.level}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`${status.color} text-white border-0`}
        >
          <StatusIcon className="mr-1 h-3 w-3" />
          {status.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Panel */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Conversation</CardTitle>
                  <CardDescription>
                    Discuss engagement details with {request.counterparty.name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Live</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 -my-6 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {allMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                allMessages.map((msg: Message) => {
                  const isOwn = msg.sender?.id === request.currentUserId;
                  const isSystem = !msg.sender;

                  // System messages (like contact reveal)
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="max-w-[85%] rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                              System Message
                            </span>
                            <span className="text-xs opacity-70 text-muted-foreground">
                              {formatDistanceToNow(new Date(msg.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap text-green-900 dark:text-green-100">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {isOwn ? "You" : msg.sender?.fullName || "Unknown"}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatDistanceToNow(new Date(msg.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            {canMessage && (
              <>
                {/* ToS Warning Banner */}
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-y border-amber-200 dark:border-amber-800/50">
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>
                      <span className="font-medium">Platform terms:</span>{" "}
                      Sharing contact information (email, phone, etc.) before
                      the deal is finalized violates our Terms of Service and
                      may result in account suspension.
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={handleInputChange}
                      disabled={sending}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      disabled={sending || !messageInput.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          {/* Engagement Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {request.role === "client" ? "Vendor" : "Client"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.counterparty.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                    {format(new Date(request.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {rate && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Agreed Rate</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(rate)}/hour
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {request.listing.developer.skills.map((s) => (
                  <Badge
                    key={s.skill.name}
                    variant={s.isPrimary ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {s.skill.name} ({s.years}y)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timesheets */}
          {["ACCEPTED", "COMPLETED"].includes(request.status) && (
            <TimesheetsPanel
              requestId={request.id}
              timesheets={request.timesheets || []}
              role={request.role as "client" | "vendor"}
              requestStatus={request.status}
            />
          )}

          {/* Actions or Locked Status */}
          {["CANCELLED", "REJECTED", "COMPLETED"].includes(request.status) ? (
            <Card className="border-muted bg-muted/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg text-muted-foreground">
                    Request {status.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This request has been {status.label.toLowerCase()} and is now
                  read-only. No further actions are available.
                </p>
                {request.status === "COMPLETED" && request.rating && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Rating</p>
                    <RatingDisplay
                      score={request.rating.score}
                      comment={request.rating.comment}
                      fromCompanyName={request.rating.fromCompany.name}
                    />
                  </div>
                )}
                {request.status === "COMPLETED" && !request.rating && (
                  <div className="mt-4">
                    <RatingDialog
                      requestId={request.id}
                      counterpartyName={request.counterparty.name}
                      hasExistingRating={!!request.rating}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canRespond && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => setOfferDialogOpen(true)}
                      disabled={updating}
                    >
                      Accept & Create Offer
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() =>
                        setPendingAction({
                          status: "REJECTED",
                          title: "Decline Request",
                          description: `Are you sure you want to decline this request from ${request.counterparty.name}? This action cannot be undone.`,
                          confirmLabel: "Decline",
                          variant: "destructive",
                        })
                      }
                      disabled={updating}
                    >
                      Decline
                    </Button>
                  </>
                )}

                {/* Vendor waiting message when offer is sent */}
                {isVendor && request.status === "OFFER_SENT" && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800/50">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Offer sent!
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Waiting for {request.counterparty.name} to pay the
                            matchmaking fee and finalize the deal.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setPendingAction({
                          status: "REVISE_OFFER",
                          title: "Revise Offer",
                          description: `This will return the request to negotiating status and clear the current offer, allowing you to send a new offer.`,
                          confirmLabel: "Revise Offer",
                        })
                      }
                      disabled={updating}
                    >
                      Revise Offer
                    </Button>
                  </div>
                )}

                {/* Buyer payment button when offer is sent */}
                {canFinalize && (
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800/50">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100">
                            Vendor accepted your request!
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Pay the matchmaking fee to finalize the deal and
                            unlock vendor contact information.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleFinalizePayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        "Redirecting to payment..."
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          Finalize Deal (€{matchmakingFee})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {canStart && (
                  <Button
                    className="w-full"
                    onClick={() =>
                      setPendingAction({
                        status: "IN_PROGRESS",
                        title: "Start Engagement",
                        description:
                          "Are you sure you want to start this engagement? This will begin the work period and enable timesheet logging.",
                        confirmLabel: "Start Engagement",
                      })
                    }
                    disabled={updating}
                  >
                    Start Engagement
                  </Button>
                )}

                {canComplete && (
                  <Button
                    className="w-full"
                    onClick={() =>
                      setPendingAction({
                        status: "COMPLETED",
                        title: "Complete Engagement",
                        description:
                          "Are you sure you want to mark this engagement as completed? Make sure all timesheets have been logged and approved.",
                        confirmLabel: "Mark as Completed",
                      })
                    }
                    disabled={updating}
                  >
                    Mark as Completed
                  </Button>
                )}

                {request.status === "PENDING" && request.role === "client" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setPendingAction({
                        status: "CANCELLED",
                        title: "Cancel Request",
                        description:
                          "Are you sure you want to cancel this request? This action cannot be undone.",
                        confirmLabel: "Cancel Request",
                        variant: "destructive",
                      })
                    }
                    disabled={updating}
                  >
                    Cancel Request
                  </Button>
                )}

                {["ACCEPTED", "IN_PROGRESS"].includes(request.status) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setPendingAction({
                        status: "CANCELLED",
                        title: "Cancel Engagement",
                        description:
                          "Are you sure you want to cancel this engagement? This will terminate the work arrangement and cannot be undone.",
                        confirmLabel: "Cancel Engagement",
                        variant: "destructive",
                      })
                    }
                    disabled={updating}
                  >
                    Cancel Engagement
                  </Button>
                )}

                {request.status === "COMPLETED" && !request.rating && (
                  <RatingDialog
                    requestId={request.id}
                    counterpartyName={request.counterparty.name}
                    hasExistingRating={!!request.rating}
                  />
                )}

                {request.rating && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Rating</p>
                    <RatingDisplay
                      score={request.rating.score}
                      comment={request.rating.comment}
                      fromCompanyName={request.rating.fromCompany.name}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={updating}
              onClick={async (e) => {
                e.preventDefault();
                if (pendingAction) {
                  await handleStatusUpdate(pendingAction.status);
                  setPendingAction(null);
                }
              }}
              className={
                pendingAction?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {updating ? "Processing..." : pendingAction?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Offer Dialog */}
      <SendOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        requestId={request.id}
        defaultRate={Number(request.listing.hourlyRate)}
        defaultStartDate={request.startDate}
        defaultEndDate={request.endDate}
        counterpartyName={request.counterparty.name}
        matchmakingFee={matchmakingFee}
      />
    </div>
  );
}
