import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListAppointments, useListPrescriptions, useListNotifications } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Pill, Bell } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: appointments } = useListAppointments({ status: "confirmed", patientId: user?.id });
  const { data: prescriptions } = useListPrescriptions({ patientId: user?.id });
  const { data: notifications } = useListNotifications();

  return (
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.firstName}</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments?.length || 0}</div>
              <Button variant="link" className="px-0 mt-4" asChild>
                <Link href="/patient/appointments">View all appointments</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prescriptions?.length || 0}</div>
              <Button variant="link" className="px-0 mt-4" asChild>
                <Link href="/patient/prescriptions">View prescriptions</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications?.filter(n => !n.isRead).length || 0} Unread</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Next Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  <div className="font-semibold text-lg">{appointments[0].serviceName}</div>
                  <div className="text-sm text-muted-foreground">Dr. {appointments[0].doctorName}</div>
                  <div className="text-sm">{new Date(appointments[0].date).toLocaleDateString()} at {appointments[0].time}</div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm py-4">No upcoming appointments</div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="flex flex-col gap-1 border-b last:border-0 pb-2 last:pb-0">
                      <span className="font-medium text-sm">{n.title}</span>
                      <span className="text-sm text-muted-foreground">{n.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm py-4">No new notifications</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
