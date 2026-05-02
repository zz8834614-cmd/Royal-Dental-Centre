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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Users,
  Clock,
  Star,
  CalendarOff,
  Armchair,
  Stethoscope,
  CheckCheck,
  UserX,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { apiFetch } from "@/lib/api";

type VisitStatus = "not_arrived" | "waiting" | "in_consultation" | "done";

function VisitStatusBadge({ status, isAr }: { status: VisitStatus; isAr: boolean }) {
  const map: Record<VisitStatus, { label: string; labelAr: string; className: string; icon: React.ReactNode }> = {
    not_arrived: {
      label: "Not Arrived",
      labelAr: "لم يصل",
      className: "bg-slate-100 text-slate-600 border-slate-200",
      icon: <UserX className="h-3 w-3" />,
    },
    waiting: {
      label: "Waiting Room",
      labelAr: "في غرفة الانتظار",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Armchair className="h-3 w-3" />,
    },
    in_consultation: {
      label: "In Consultation",
      labelAr: "في الجلسة",
      className: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <Stethoscope className="h-3 w-3" />,
    },
    done: {
      label: "Done",
      labelAr: "انتهى",
      className: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCheck className="h-3 w-3" />,
    },
  };
  const m = map[status] ?? map.not_arrived;
  return (
    <Badge variant="outline" className={`text-xs gap-1 flex items-center ${m.className}`}>
      {m.icon}
      {isAr ? m.labelAr : m.label}
    </Badge>
  );
}

const VISIT_CYCLE: VisitStatus[] = ["not_arrived", "waiting", "in_consultation", "done"];

function nextVisitStatus(current: VisitStatus): VisitStatus {
  const idx = VISIT_CYCLE.indexOf(current);
  return VISIT_CYCLE[Math.min(idx + 1, VISIT_CYCLE.length - 1)];
}

const EMPTY_FORM = {
  patientId: "",
  doctorId: "",
  serviceId: "",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "",
  notes: "",
};

export default function ReceptionistQueue() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: appointments, refetch } = useListAppointments({ date: today });
  const updateAppointment = useUpdateAppointment();
  const updateUser = useUpdateUser();

  const [rejectTarget, setRejectTarget] = useState<number | null>(null);

  // Schedule closed state backed by DB blocks
  const [scheduleClosed, setScheduleClosed] = useState(false);
  const [scheduleBlockId, setScheduleBlockId] = useState<number | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Add appointment modal state
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    const checkBlock = async () => {
      try {
        const blocks = await apiFetch(`/api/schedule/blocks?from=${today}&to=${today}`) as any[];
        const todayBlock = blocks.find((b: any) => b.blockedDate === today && b.isFullDay);
        if (todayBlock) {
          setScheduleClosed(true);
          setScheduleBlockId(todayBlock.id);
        } else {
          setScheduleClosed(false);
          setScheduleBlockId(null);
        }
      } catch { /* ignore */ }
    };
    checkBlock();
  }, [today]);

  // Load patients, doctors, services when modal opens
  useEffect(() => {
    if (!addOpen) return;
    Promise.all([
      apiFetch("/api/patients"),
      apiFetch("/api/users?role=doctor"),
      apiFetch("/api/services"),
    ]).then(([p, d, s]) => {
      setPatients(p ?? []);
      setDoctors(d ?? []);
      setServices(s ?? []);
    }).catch(() => {});
  }, [addOpen]);

  // Load available slots when doctor + date changes
  useEffect(() => {
    if (!form.doctorId || !form.date) {
      setAvailableSlots([]);
      return;
    }
    setSlotsLoading(true);
    apiFetch(`/api/appointments/available-slots?date=${form.date}&doctorId=${form.doctorId}`)
      .then((slots: any) => {
        setAvailableSlots(Array.isArray(slots) ? slots : []);
        setForm(f => ({ ...f, time: "" }));
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.doctorId, form.date]);

  const handleAddAppointment = async () => {
    if (!form.patientId || !form.doctorId || !form.serviceId || !form.date || !form.time) {
      toast({ title: isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    setAddLoading(true);
    try {
      await apiFetch("/api/appointments/by-receptionist", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(form.patientId),
          doctorId: Number(form.doctorId),
          serviceId: Number(form.serviceId),
          date: form.date,
          time: form.time,
          notes: form.notes || undefined,
        }),
      });
      toast({ title: isAr ? "تم إضافة الموعد بنجاح" : "Appointment added successfully" });
      setAddOpen(false);
      setForm(EMPTY_FORM);
      refetch();
    } catch (e: any) {
      toast({ title: e.message || (isAr ? "فشل إضافة الموعد" : "Failed to add appointment"), variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const toggleSchedule = async () => {
    setScheduleLoading(true);
    try {
      if (scheduleClosed && scheduleBlockId) {
        await apiFetch(`/api/schedule/blocks/${scheduleBlockId}`, { method: "DELETE" });
        setScheduleClosed(false);
        setScheduleBlockId(null);
        toast({ title: isAr ? "تم فتح جدول الحجز لليوم" : "Schedule reopened for today" });
      } else {
        const block = await apiFetch("/api/schedule/blocks", {
          method: "POST",
          body: JSON.stringify({ blockedDate: today, isFullDay: true, reason: isAr ? "إغلاق يدوي" : "Manual closure" }),
        }) as any;
        setScheduleClosed(true);
        setScheduleBlockId(block.id);
        toast({ title: isAr ? "تم إغلاق جدول الحجز لليوم" : "Schedule closed for today" });
      }
    } catch {
      toast({ title: isAr ? "فشل تحديث الجدول" : "Failed to update schedule", variant: "destructive" });
    } finally {
      setScheduleLoading(false);
    }
  };

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

  const updateVisitStatus = async (appt: Appointment, visitStatus: VisitStatus) => {
    try {
      await apiFetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        body: JSON.stringify({ visitStatus }),
      });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
      refetch();
    } catch {
      toast({ title: isAr ? "فشل التحديث" : "Update failed", variant: "destructive" });
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

  const NEXT_LABEL: Record<VisitStatus, { en: string; ar: string; icon: React.ReactNode }> = {
    not_arrived: { en: "Mark Arrived", ar: "وصل للانتظار", icon: <Armchair className="h-3 w-3" /> },
    waiting: { en: "Start Session", ar: "ابدأ الجلسة", icon: <Stethoscope className="h-3 w-3" /> },
    in_consultation: { en: "Mark Done", ar: "أنهِ الجلسة", icon: <CheckCheck className="h-3 w-3" /> },
    done: { en: "Done", ar: "مكتمل", icon: <CheckCheck className="h-3 w-3" /> },
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
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {isAr ? "إضافة موعد" : "Add Appointment"}
            </Button>
            <Button
              variant={scheduleClosed ? "destructive" : "outline"}
              onClick={toggleSchedule}
              disabled={scheduleLoading}
            >
              <CalendarOff className="h-4 w-4 me-2" />
              {scheduleClosed
                ? (isAr ? "فتح الجدول" : "Reopen Schedule")
                : (isAr ? "إغلاق الجدول" : "Close Schedule")}
            </Button>
          </div>
        </div>

        {scheduleClosed && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
            {isAr ? "⚠ الجدول مغلق لليوم - لن يتمكن المرضى من حجز مواعيد جديدة" : "⚠ Schedule is closed for today – no new bookings allowed"}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pending.length}</div>
              <div className="text-xs text-muted-foreground">{isAr ? "طلبات معلقة" : "Pending"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {queue.filter(a => (a as any).visitStatus === "in_consultation").length}
              </div>
              <div className="text-xs text-muted-foreground">{isAr ? "في الجلسة" : "In Session"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {queue.filter(a => (a as any).visitStatus === "waiting").length}
              </div>
              <div className="text-xs text-muted-foreground">{isAr ? "في الانتظار" : "Waiting"}</div>
            </CardContent>
          </Card>
        </div>

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
                {queue.map((appt, idx) => {
                  const visitStatus = ((appt as any).visitStatus ?? "not_arrived") as VisitStatus;
                  const nextStatus = nextVisitStatus(visitStatus);
                  const nextLabel = NEXT_LABEL[visitStatus];
                  const isDone = visitStatus === "done";

                  let cardBg = "bg-green-50/40 dark:bg-green-950/10";
                  if (visitStatus === "waiting") cardBg = "bg-yellow-50/40 dark:bg-yellow-950/10";
                  if (visitStatus === "in_consultation") cardBg = "bg-blue-50/40 dark:bg-blue-950/10";
                  if (visitStatus === "done") cardBg = "bg-muted/30 opacity-70";

                  return (
                    <div key={appt.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border ${cardBg}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            <VisitStatusBadge status={visitStatus} isAr={isAr} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {appt.time} • Dr. {appt.doctorName} • {appt.serviceName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 flex-wrap">
                        {!isDone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => updateVisitStatus(appt, nextStatus)}
                          >
                            {nextLabel.icon}
                            {isAr ? nextLabel.ar : nextLabel.en}
                          </Button>
                        )}
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
                  );
                })}
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
                    <Badge variant="outline" className={`text-xs ${appt.status === "completed" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {appt.status === "completed" ? (isAr ? "مكتمل" : "Completed") : (isAr ? "ملغى" : "Cancelled")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Appointment Dialog */}
      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة موعد جديد" : "Add New Appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Patient */}
            <div className="space-y-1">
              <Label>{isAr ? "المريض *" : "Patient *"}</Label>
              <Select value={form.patientId} onValueChange={v => setForm(f => ({ ...f, patientId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر المريض" : "Select patient"} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.firstName} {p.lastName} {p.phone ? `• ${p.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor */}
            <div className="space-y-1">
              <Label>{isAr ? "الطبيب *" : "Doctor *"}</Label>
              <Select value={form.doctorId} onValueChange={v => setForm(f => ({ ...f, doctorId: v, time: "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر الطبيب" : "Select doctor"} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      Dr. {d.firstName} {d.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service */}
            <div className="space-y-1">
              <Label>{isAr ? "الخدمة *" : "Service *"}</Label>
              <Select value={form.serviceId} onValueChange={v => setForm(f => ({ ...f, serviceId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر الخدمة" : "Select service"} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {isAr ? (s.nameAr || s.name) : s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label>{isAr ? "التاريخ *" : "Date *"}</Label>
              <Input
                type="date"
                value={form.date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={e => setForm(f => ({ ...f, date: e.target.value, time: "" }))}
              />
            </div>

            {/* Time */}
            <div className="space-y-1">
              <Label>{isAr ? "الوقت *" : "Time *"}</Label>
              {slotsLoading ? (
                <p className="text-sm text-muted-foreground">{isAr ? "جاري تحميل المواعيد..." : "Loading slots..."}</p>
              ) : availableSlots.length > 0 ? (
                <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر الوقت" : "Select time"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : form.doctorId && form.date ? (
                <p className="text-sm text-muted-foreground py-1">
                  {isAr ? "لا توجد أوقات متاحة لهذا اليوم" : "No available slots for this day"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground py-1">
                  {isAr ? "اختر الطبيب والتاريخ أولاً" : "Select doctor and date first"}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
              <Input
                placeholder={isAr ? "ملاحظات اختيارية..." : "Optional notes..."}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddAppointment} disabled={addLoading}>
              {addLoading ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة الموعد" : "Add Appointment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
