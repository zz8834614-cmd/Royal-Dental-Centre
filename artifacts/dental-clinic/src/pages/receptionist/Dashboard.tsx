import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, ListOrdered, Users, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function ReceptionistDashboard() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: pendingAppts } = useListAppointments({ status: "pending", date: today });
  const { data: confirmedAppts } = useListAppointments({ status: "confirmed", date: today });
  const { data: allTodayAppts } = useListAppointments({ date: today });

  const pendingCount = pendingAppts?.length ?? 0;
  const confirmedCount = confirmedAppts?.length ?? 0;
  const totalToday = allTodayAppts?.length ?? 0;

  const upcomingQueue = confirmedAppts
    ?.slice()
    .sort((a, b) => (a.queuePosition ?? 9999) - (b.queuePosition ?? 9999))
    .slice(0, 5);

  return (
    <DashboardLayout allowedRoles={["receptionist"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "لوحة الاستقبال" : "Reception Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? `اليوم: ${today}` : `Today: ${today}`}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAr ? "في الانتظار" : "Pending"}
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">{isAr ? "تحتاج إلى قبول" : "Need acceptance"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAr ? "مؤكدة" : "Confirmed"}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{confirmedCount}</div>
              <p className="text-xs text-muted-foreground">{isAr ? "في قائمة الانتظار" : "In queue today"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAr ? "إجمالي اليوم" : "Total Today"}
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{totalToday}</div>
              <p className="text-xs text-muted-foreground">{isAr ? "مواعيد الجلسة" : "Session appointments"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle className="text-base">
                {isAr ? "قائمة الانتظار الحالية" : "Current Queue"}
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/receptionist/queue">
                  <ListOrdered className="h-4 w-4 me-2" />
                  {isAr ? "إدارة القائمة" : "Manage Queue"}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {!upcomingQueue || upcomingQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد مواعيد مؤكدة اليوم" : "No confirmed appointments today"}
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingQueue.map((appt, idx) => (
                    <div key={appt.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {appt.queuePosition ?? idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{appt.time} • {appt.serviceName}</p>
                      </div>
                      {appt.patientIsSubscribed && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {isAr ? "مشترك" : "Sub"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isAr ? "طلبات الانتظار" : "Pending Requests"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!pendingAppts || pendingAppts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {isAr ? "لا توجد طلبات انتظار" : "No pending requests"}
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingAppts.slice(0, 5).map((appt) => (
                    <div key={appt.id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.patientName}</p>
                        <p className="text-xs text-muted-foreground">{appt.time} • Dr. {appt.doctorName}</p>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-xs shrink-0">
                        {isAr ? "انتظار" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                  {pendingAppts.length > 5 && (
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link href="/receptionist/queue">
                        {isAr ? `عرض الكل (${pendingAppts.length})` : `View all (${pendingAppts.length})`}
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
