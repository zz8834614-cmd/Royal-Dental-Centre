import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListAppointments, useCreateAppointment, useUpdateAppointment, useListServices, useListUsers, useGetAvailableSlots, getGetAvailableSlotsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, UserIcon, Plus, X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const bookSchema = z.object({
  serviceId: z.string().min(1),
  doctorId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional(),
});

export default function PatientAppointments() {
  const { user } = useAuth();
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);

  const { data: appointments, refetch: refetchAppointments } = useListAppointments({ patientId: user?.id });
  const { data: services } = useListServices();
  const { data: doctors } = useListUsers({ role: "doctor" });
  const updateAppointment = useUpdateAppointment();

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: { serviceId: "", doctorId: "", date: format(new Date(), "yyyy-MM-dd"), time: "", notes: "" },
  });

  const selectedDate = form.watch("date");
  const selectedDoctor = form.watch("doctorId");
  const selectedService = form.watch("serviceId");

  const { data: slots } = useGetAvailableSlots(
    { date: selectedDate, doctorId: Number(selectedDoctor), serviceId: Number(selectedService) },
    { query: { enabled: !!selectedDate && !!selectedDoctor && !!selectedService, queryKey: getGetAvailableSlotsQueryKey({ date: selectedDate, doctorId: Number(selectedDoctor), serviceId: Number(selectedService) }) } }
  );

  const createAppointment = useCreateAppointment();

  const onSubmit = async (values: z.infer<typeof bookSchema>) => {
    try {
      await createAppointment.mutateAsync({
        data: { serviceId: Number(values.serviceId), doctorId: Number(values.doctorId), date: values.date, time: values.time, notes: values.notes },
      });
      toast({ title: isAr ? "تم حجز الموعد بنجاح!" : "Appointment booked successfully!" });
      setIsBooking(false);
      form.reset();
      refetchAppointments();
    } catch (error: any) {
      toast({ title: isAr ? "فشل الحجز" : "Failed to book", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await updateAppointment.mutateAsync({ id: String(id), data: { status: "cancelled" } });
      toast({ title: isAr ? "تم إلغاء الموعد" : "Appointment cancelled" });
      refetchAppointments();
    } catch (error: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: error.message, variant: "destructive" });
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
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "مواعيدي" : "My Appointments"}
          </h1>

          <Dialog open={isBooking} onOpenChange={setIsBooking}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {isAr ? "حجز موعد" : "Book Appointment"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{isAr ? "حجز موعد جديد" : "Book a New Appointment"}</DialogTitle>
                <DialogDescription>
                  {isAr ? "اختر الخدمة والطبيب والوقت المناسب" : "Select a service, doctor, and an available time slot."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="serviceId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "الخدمة" : "Service"}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={isAr ? "اختر الخدمة" : "Select a service"} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {services?.filter(s => s.isActive).map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {isAr ? s.nameAr : s.name} - {s.price} {isAr ? "د.ج" : "DZD"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="doctorId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "الطبيب" : "Doctor"}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={isAr ? "اختر الطبيب" : "Select a doctor"} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {doctors?.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>
                              Dr. {d.firstName} {d.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isAr ? "التاريخ" : "Date"}</FormLabel>
                        <FormControl><Input type="date" min={format(new Date(), "yyyy-MM-dd")} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isAr ? "الوقت" : "Time Slot"}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!slots || slots.length === 0}>
                          <FormControl><SelectTrigger><SelectValue placeholder={isAr ? "اختر الوقت" : "Select time"} /></SelectTrigger></FormControl>
                          <SelectContent>
                            {slots?.filter(s => s.available).map(s => (
                              <SelectItem key={s.time} value={s.time}>{s.time}</SelectItem>
                            ))}
                            {slots && slots.filter(s => s.available).length === 0 && (
                              <SelectItem value="none" disabled>{isAr ? "لا توجد أوقات متاحة" : "No slots available"}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAr ? "ملاحظات (اختياري)" : "Notes (Optional)"}</FormLabel>
                      <FormControl><Input placeholder={isAr ? "أي مخاوف محددة؟" : "Any specific concerns?"} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createAppointment.isPending}>
                      {createAppointment.isPending ? (isAr ? "جاري الحجز..." : "Booking...") : (isAr ? "تأكيد الحجز" : "Confirm Booking")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {appointments?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "لا توجد مواعيد" : "No appointments found"}</p>
              </CardContent>
            </Card>
          ) : (
            appointments?.map(apt => (
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
                          Dr. {apt.doctorName}
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
                    {(apt.status === "pending" || apt.status === "confirmed") && (
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" onClick={() => handleCancel(apt.id)}>
                          <X className="h-4 w-4 me-1" />
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    )}
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
