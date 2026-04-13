import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, UserIcon, Check, X, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { language } = useI18n();
  const isAr = language === "ar";
  const { data: appointments, refetch } = useListAppointments({ doctorId: user?.id });
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  const handleStatusChange = async (id: number, status: "confirmed" | "completed" | "cancelled") => {
    try {
      await updateAppointment.mutateAsync({ id, data: { status } });
      const labels: Record<string, string> = {
        confirmed: isAr ? "تم تأكيد الموعد" : "Appointment confirmed",
        completed: isAr ? "تم إكمال الموعد" : "Appointment completed",
        cancelled: isAr ? "تم إلغاء الموعد" : "Appointment cancelled",
      };
      toast({ title: labels[status] });
      refetch();
    } catch (error: any) {
      toast({ title: isAr ? "فشل التحديث" : "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      confirmed: { label: isAr ? "مؤكد" : "Confirmed", variant: "default" },
      pending: { label: isAr ? "قيد الانتظار" : "Pending", variant: "secondary" },
      completed: { label: isAr ? "مكتمل" : "Completed", variant: "outline" },
      cancelled: { label: isAr ? "ملغي" : "Cancelled", variant: "destructive" },
    };
    const s = labels[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <DashboardLayout allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "إدارة المواعيد" : "Manage Appointments"}
        </h1>

        <div className="grid gap-4">
          {!appointments || appointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "لا توجد مواعيد" : "No appointments found"}</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map(apt => (
              <Card key={apt.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold">{apt.serviceName}</h3>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {apt.patientName}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {format(new Date(apt.date), "yyyy-MM-dd")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {apt.time}
                        </div>
                      </div>
                      {apt.notes && (
                        <p className="text-sm text-muted-foreground">
                          {isAr ? "ملاحظات:" : "Notes:"} {apt.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {apt.status === "pending" && (
                        <Button size="sm" onClick={() => handleStatusChange(apt.id, "confirmed")}>
                          <Check className="h-4 w-4 me-1" />
                          {isAr ? "تأكيد" : "Confirm"}
                        </Button>
                      )}
                      {(apt.status === "pending" || apt.status === "confirmed") && (
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange(apt.id, "completed")}>
                          <CheckCircle className="h-4 w-4 me-1" />
                          {isAr ? "إكمال" : "Complete"}
                        </Button>
                      )}
                      {apt.status !== "cancelled" && apt.status !== "completed" && (
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(apt.id, "cancelled")}>
                          <X className="h-4 w-4 me-1" />
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
