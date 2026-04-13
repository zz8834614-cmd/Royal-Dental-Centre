import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListConversations, useCreateConversation, useListMessages, useSendMessage, useListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Plus, User as UserIcon, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Chat() {
  const { user } = useAuth();
  const { language } = useI18n();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);

  const { data: conversations, refetch: refetchConvs } = useListConversations();
  const { data: messages, refetch: refetchMessages } = useListMessages(
    { conversationId: activeConv! },
    { query: { enabled: !!activeConv, refetchInterval: 3000 } }
  );
  const sendMessage = useSendMessage();
  const createConversation = useCreateConversation();

  const targetRole = user?.role === "patient" ? "doctor" : "patient";
  const { data: availableUsers } = useListUsers({ role: targetRole });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !activeConv) return;
    try {
      await sendMessage.mutateAsync({
        data: { conversationId: activeConv, content: messageText.trim() },
      });
      setMessageText("");
      await refetchMessages();
    } catch (_) {}
  };

  const handleStartConversation = async (participantId: number) => {
    try {
      const conv = await createConversation.mutateAsync({
        data: { participantId },
      });
      await refetchConvs();
      setActiveConv(conv.id);
      setNewChatOpen(false);
    } catch (_) {}
  };

  const getOtherName = (conv: any) => {
    if (!conv.participantIds || !conv.participantNames) return "Unknown";
    const idx = conv.participantIds[0] === user?.id ? 1 : 0;
    return conv.participantNames[idx] || "Unknown";
  };

  const activeConvData = conversations?.find(c => c.id === activeConv);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "الدردشة" : "Messages"}
          </h1>
          <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 me-1" />
                {isAr ? "محادثة جديدة" : "New Chat"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isAr ? "بدء محادثة جديدة" : "Start New Conversation"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {availableUsers?.map(u => (
                  <Button
                    key={u.id}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => handleStartConversation(u.id)}
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-start">
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                    </div>
                  </Button>
                ))}
                {availableUsers?.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    {isAr ? "لا يوجد مستخدمين" : "No users available"}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          <div className="w-full sm:w-72 shrink-0 border rounded-lg overflow-y-auto bg-card">
            {conversations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{isAr ? "لا توجد محادثات" : "No conversations"}</p>
              </div>
            ) : (
              conversations?.map(conv => (
                <button
                  key={conv.id}
                  className={cn(
                    "w-full text-start p-3 border-b transition-colors hover:bg-accent",
                    activeConv === conv.id && "bg-accent"
                  )}
                  onClick={() => setActiveConv(conv.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full shrink-0">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{getOtherName(conv)}</p>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || (isAr ? "لا توجد رسائل" : "No messages")}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className={cn("flex-1 flex-col border rounded-lg bg-card", activeConv ? "flex" : "hidden sm:flex")}>
            {activeConv ? (
              <>
                <div className="p-3 border-b flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => setActiveConv(null)}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{activeConvData ? getOtherName(activeConvData) : ""}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages?.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2",
                        msg.senderId === user?.id
                          ? "bg-primary text-primary-foreground ms-auto"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!messageText.trim() || sendMessage.isPending} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "اختر محادثة للبدء" : "Select a conversation to start"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
