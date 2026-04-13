import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import {
  useListAppointments,
  useUpdateAppointment,
  useUpdateUser,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Users,
  Clock,
  Star,
  CalendarOff,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Appointment } from "@workspace/api-client-react";
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

function StatusBadge({ status, isAr }: { status: string; isAr: boolean }) {
  const map: Record<string, { label: string; labelAr: string; className: string }> = {
    pending: { label: "Pending", labelAr: "انتظار", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    confirmed: { label: "Confirmed", labelAr: "مؤكد", className: "bg-green-100 text-green-800 border-green-300" },
    completed: { label: "Completed", labelAr: "مكتمل", className: "bg-blue-100 text-blue-800 border-blue-300" },
    cancelled: { label: "Cancelled", labelAr: "ملغى", className: "bg-red-100 text-red-800 border-red-300" },
  };
  const m = map[status] || map.pending;
  return (
    <Badge variant="outline" className={`text-xs ${m.className}`}>
      {isAr ? m.labelAr : m.label}
    </Badge>
  );
}

export default function ReceptionistQueue() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: appointments, refetch } = useListAppointments({ date: today });
  const updateAppointment = useUpdateAppointment();
  const updateUser = useUpdateUser();

  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [scheduleClosed, setScheduleClosed] = useState(false);

  const pending = appointments?.filter(a => a.status === "pending") ?? [];
  const queue = appointments
    ?.filter(a => a.status === "confirmed")
    .slice()
    .sort((a, b) => (a.queuePosition ?? 9999) - (b.queuePosition ?? 9999)) ?? [];
  const others = appointments?.filter(a => a.status === "completed" || a.status === "cancelled") ?? [];

  const handleAccept = async (appt: Appointment) => {
    const nextPos = queue.length > 0 ? Math.max(...queue.map(a => a.queuePosition ?? 0)) + 1 : 1;
    try {
      await updateAppointment.mutateAsync({
        id: appt.id,
        data: { status: "confirmed", queuePosition: nextPos },
      });
      toast({ title: isAr ? "تم قبول الموعد" : "Appointment accepted" });
      refetch();
    } catch {
      toast({ title: isAr ? "فشل القبول" : "Failed", variant: "destructive" });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await updateAppointment.mutateAsync({ id, data: { status: "cancelled" } });
      toast({ title: isAr ? "تم رفض الموعد" : "Appointment rejected" });
      setRejectTarget(null);
      refetch();
    } catch {
      toast({ title: isAr ? "فشل الرفض" : "Failed", variant: "destructive" });
    }
  };

  const moveInQueue = async (appt: Appointment, direction: "up" | "down") => {
    const idx = queue.findIndex(a => a.id === appt.id);
    if (direction === "up" && idx <= 0) return;
    if (direction === "down" && idx >= queue.length - 1) return;

    const swapWith = queue[direction === "up" ? idx - 1 : idx + 1];
    try {
      await Promise.all([
        updateAppointment.mutateAsync({ id: appt.id, data: { queuePosition: swapWith.queuePosition ?? idx } }),
        updateAppointment.mutateAsync({ id: swapWith.id, data: { queuePosition: appt.queuePosition ?? idx + 1 } }),
      ]);
      refetch();
    } catch {
      toast({ title: isAr ? "فشل إعادة الترتيب" : "Failed to reorder", variant: "destructive" });
    }
  };

  const toggleSubscription = async (appt: Appointment) => {
    const currentVal = appt.patientIsSubscribed;
    try {
      await updateUser.mutateAsync({
        id: appt.patientId,
        data: { isSubscribed: !currentVal },
      });
      toast({
        title: currentVal
          ? (isAr ? "تم إلغاء الاشتراك" : "Subscription removed")
          : (isAr ? "تم تفعيل الاشتراك" : "Subscription activated"),
      });
      refetch();
    } catch {
      toast({ title: isAr ? "فشل التحديث" : "Failed", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["receptionist"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isAr ? "إدارة قائمة الانتظار" : "Queue Management"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{isAr ? `اليوم: ${today}` : `Today: ${today}`}</p>
          </div>
          <Button
            variant={scheduleClosed ? "destructive" : "outline"}
            onClick={() => {
              setScheduleClosed(!scheduleClosed);
              toast({
                title: scheduleClosed
                  ? (isAr ? "تم فتح جدول الحجز" : "Schedule reopened")
                  : (isAr ? "تم إغلاق جدول الحجز" : "Schedule closed for today"),
              });
            }}
          >
            <CalendarOff className="h-4 w-4 me-2" />
            {scheduleClosed
              ? (isAr ? "فتح الجدول" : "Reopen Schedule")
              : (isAr ? "إغلاق الجدول" : "Close Schedule")}
          </Button>
        </div>

        {scheduleClosed && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
            {isAr ? "⚠ الجدول مغلق لليوم - لن يتمكن المرضى من حجز مواعيد جديدة" : "⚠ Schedule is closed for today"}
          </div>
        )}

        {/* Pending requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              {isAr ? "طلبات الانتظار" : "Pending Requests"}
              {pending.length > 0 && (
                <Badge className="ms-1 bg-yellow-500 text-white">{pending.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAr ? "لا توجد طلبات انتظار" : "No pending requests"}
              </p>
            ) : (
              <div className="space-y-2">
                {pending.map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-50/40 dark:bg-yellow-950/10">
                    <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{appt.patientName}</p>
                        {appt.patientIsSubscribed && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Star className="h-3 w-3" />
                            {isAr ? "مشترك" : "Subscribed"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {appt.time} • Dr. {appt.doctorName} • {appt.serviceName}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAccept(appt)}
                        disabled={updateAppointment.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 me-1" />
                        {isAr ? "قبول" : "Accept"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setRejectTarget(appt.id)}
                        disabled={updateAppointment.isPending}
                      >
                        <XCircle className="h-4 w-4 me-1" />
                        {isAr ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {isAr ? "قائمة الانتظار النشطة" : "Active Queue"}
              {queue.length > 0 && (
                <Badge className="ms-1 bg-green-600 text-white">{queue.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAr ? "لا توجد مواعيد مؤكدة اليوم" : "No confirmed appointments in queue"}
              </p>
            ) : (
              <div className="space-y-2">
                {queue.map((appt, idx) => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/40 dark:bg-green-950/10">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{appt.patientName}</p>
                        {appt.patientIsSubscribed && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Star className="h-3 w-3" />
                            {isAr ? "مشترك" : "Subscribed"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {appt.time} • Dr. {appt.doctorName} • {appt.serviceName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleSubscription(appt)}
                        title={isAr ? "تبديل الاشتراك" : "Toggle subscription"}
                      >
                        <Star className={`h-3.5 w-3.5 ${appt.patientIsSubscribed ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveInQueue(appt, "up")}
                        disabled={idx === 0 || updateAppointment.isPending}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveInQueue(appt, "down")}
                        disabled={idx === queue.length - 1 || updateAppointment.isPending}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setRejectTarget(appt.id)}
                        disabled={updateAppointment.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed / Cancelled */}
        {others.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-muted-foreground">
                {isAr ? "مكتملة / ملغاة" : "Completed / Cancelled"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {others.map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{appt.patientName}</p>
                      <p className="text-xs text-muted-foreground">{appt.time} • {appt.serviceName}</p>
                    </div>
                    <StatusBadge status={appt.status} isAr={isAr} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={rejectTarget !== null} onOpenChange={() => setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الرفض" : "Confirm Rejection"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? "هل أنت متأكد من رفض هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to reject this appointment? This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => rejectTarget && handleReject(rejectTarget)}
            >
              {isAr ? "رفض" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
