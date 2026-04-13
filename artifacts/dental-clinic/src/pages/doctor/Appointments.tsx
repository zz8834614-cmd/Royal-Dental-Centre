import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, UserIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { data: appointments, refetch } = useListAppointments({ doctorId: user?.id });
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  const handleStatusChange = async (id: number, status: "confirmed" | "completed" | "cancelled") => {
    try {
      await updateAppointment.mutateAsync({ id, data: { status } });
      toast({ title: `Appointment ${status}` });
      refetch();
    } catch (error: any) {
      toast({ title: "Failed to update appointment", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "confirmed": return <Badge className="bg-green-500">Confirmed</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "completed": return <Badge variant="outline">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Appointments</h1>

        <div className="grid gap-4">
          {!appointments || appointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                <p>No appointments found</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map(apt => (
              <Card key={apt.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
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
                          {format(new Date(apt.date), "MMMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {apt.time}
                        </div>
                      </div>
                      {apt.notes && (
                        <p className="text-sm mt-2 text-muted-foreground">Notes: {apt.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {apt.status === "pending" && (
                        <Button size="sm" onClick={() => handleStatusChange(apt.id, "confirmed")}>
                          Confirm
                        </Button>
                      )}
                      {(apt.status === "pending" || apt.status === "confirmed") && (
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange(apt.id, "completed")}>
                          Complete
                        </Button>
                      )}
                      {apt.status !== "cancelled" && apt.status !== "completed" && (
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(apt.id, "cancelled")}>
                          Cancel
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
