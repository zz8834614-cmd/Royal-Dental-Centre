import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListConversations, useCreateConversation, useListUsers, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, Plus, User as UserIcon, ArrowRight, Paperclip, ImageIcon, X, Download, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_LIST = ["❤️", "👍", "😂", "😮", "😢", "👏", "🔥", "🎉"];

type Reaction = Record<string, number[]>;

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: string;
  fileName: string | null;
  fileData: string | null;
  reactions: Reaction;
  createdAt: string;
}

function formatTime(isoDate: string, isAr: boolean) {
  return new Date(isoDate).toLocaleTimeString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" });
}

function ReactionBubbles({
  reactions,
  messageId,
  currentUserId,
  onReact,
}: {
  reactions: Reaction;
  messageId: number;
  currentUserId: number;
  onReact: (msgId: number, emoji: string) => void;
}) {
  const entries = Object.entries(reactions).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReact(messageId, emoji)}
          className={cn(
            "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
            users.includes(currentUserId)
              ? "bg-primary/20 border-primary/40 text-primary font-semibold"
              : "bg-muted border-border hover:bg-accent"
          )}
        >
          <span>{emoji}</span>
          <span className="opacity-70">{users.length}</span>
        </button>
      ))}
    </div>
  );
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="flex gap-1 bg-popover border rounded-full px-2 py-1 shadow-md">
      {EMOJI_LIST.map(e => (
        <button
          key={e}
          onClick={() => onPick(e)}
          className="text-lg hover:scale-125 transition-transform"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function MessageBubble({
  msg,
  isMine,
  currentUserId,
  isAr,
  onReact,
}: {
  msg: ChatMessage;
  isMine: boolean;
  currentUserId: number;
  isAr: boolean;
  onReact: (msgId: number, emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handlePick = (emoji: string) => {
    onReact(msg.id, emoji);
    setShowPicker(false);
  };

  return (
    <div className={cn("group flex flex-col max-w-[75%]", isMine ? "ms-auto items-end" : "items-start")}>
      <div className="relative">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 break-words",
            isMine ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {msg.messageType === "image" && msg.fileData ? (
            <div className="space-y-1">
              <img
                src={msg.fileData}
                alt={msg.fileName ?? "image"}
                className="max-w-[220px] max-h-[260px] rounded-lg object-cover cursor-pointer"
                onClick={() => window.open(msg.fileData!, "_blank")}
              />
              {msg.content && <p className="text-sm mt-1">{msg.content}</p>}
            </div>
          ) : msg.messageType === "file" && msg.fileData ? (
            <a
              href={msg.fileData}
              download={msg.fileName ?? "file"}
              className={cn(
                "flex items-center gap-2 text-sm underline-offset-2 hover:underline",
                isMine ? "text-primary-foreground" : "text-foreground"
              )}
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[180px]">{msg.fileName ?? (isAr ? "ملف" : "File")}</span>
            </a>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          )}
          <p className="text-[10px] opacity-60 mt-1">{formatTime(msg.createdAt, isAr)}</p>
        </div>

        <div
          ref={pickerRef}
          className={cn(
            "absolute bottom-full mb-1 z-10 transition-opacity",
            isMine ? "right-0" : "left-0",
            showPicker ? "opacity-100" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          )}
        >
          {showPicker ? (
            <EmojiPicker onPick={handlePick} />
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="bg-popover border rounded-full p-1 shadow-sm hover:bg-accent transition-colors"
            >
              <Smile className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <ReactionBubbles
        reactions={msg.reactions}
        messageId={msg.id}
        currentUserId={currentUserId}
        onReact={onReact}
      />
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { language } = useI18n();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ data: string; name: string; type: "image" | "file" } | null>(null);

  const { data: conversations, refetch: refetchConvs } = useListConversations();
  const createConversation = useCreateConversation();

  const targetRole = user?.role === "patient" ? "doctor" : user?.role === "receptionist" ? undefined : "patient";
  const { data: allUsers } = useListUsers(targetRole ? { role: targetRole } : {});
  const availableUsers = user?.role === "receptionist"
    ? allUsers?.filter(u => u.role === "admin" || u.role === "doctor")
    : allUsers;

  const fetchMessages = useCallback(async (convId: number) => {
    try {
      const data = await customFetch<ChatMessage[]>(`/api/messages?conversationId=${convId}`);
      setMessages(data ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!activeConv) { setMessages([]); return; }
    fetchMessages(activeConv);
    pollRef.current = setInterval(() => fetchMessages(activeConv), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if ((!messageText.trim() && !pendingFile) || !activeConv) return;
    setSending(true);
    try {
      const body: Record<string, unknown> = {
        conversationId: activeConv,
        content: pendingFile ? (messageText.trim() || (pendingFile.type === "image" ? "📷" : pendingFile.name)) : messageText.trim(),
        messageType: pendingFile ? pendingFile.type : "text",
        fileName: pendingFile?.name ?? undefined,
        fileData: pendingFile?.data ?? undefined,
      };
      await customFetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
      setMessageText("");
      setPendingFile(null);
      await fetchMessages(activeConv);
      await refetchConvs();
    } catch (_) {} finally {
      setSending(false);
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    try {
      await customFetch(`/api/messages/${msgId}/reactions`, { method: "POST", body: JSON.stringify({ emoji }) });
      await fetchMessages(activeConv!);
    } catch (_) {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(isAr ? "حجم الملف يجب أن يكون أقل من 5 ميجا" : "File size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingFile({
        data: ev.target!.result as string,
        name: file.name,
        type: isImage ? "image" : "file",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleStartConversation = async (participantId: number) => {
    try {
      const conv = await createConversation.mutateAsync({ data: { participantId } });
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
          <div className={cn("w-full sm:w-72 shrink-0 border rounded-lg overflow-y-auto bg-card", activeConv ? "hidden sm:block" : "block")}>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={msg.senderId === user?.id}
                      currentUserId={user?.id ?? 0}
                      isAr={isAr}
                      onReact={handleReact}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {pendingFile && (
                  <div className="px-3 py-2 border-t bg-muted/40 flex items-center gap-2">
                    {pendingFile.type === "image" ? (
                      <img src={pendingFile.data} alt="preview" className="h-12 w-12 object-cover rounded-lg" />
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{pendingFile.name}</span>
                      </div>
                    )}
                    <button onClick={() => setPendingFile(null)} className="ms-auto text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="p-3 border-t flex gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx";
                        fileInputRef.current.click();
                      }
                    }}
                    title={isAr ? "إرسال ملف" : "Send file"}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*";
                        fileInputRef.current.click();
                      }
                    }}
                    title={isAr ? "إرسال صورة" : "Send image"}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={(!messageText.trim() && !pendingFile) || sending}
                    size="icon"
                    className="shrink-0"
                  >
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
