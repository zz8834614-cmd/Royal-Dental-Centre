import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useListAppointments, useCreateAppointment, useListServices, useListUsers, useGetAvailableSlots, getGetAvailableSlotsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { CalendarDays, Clock, Stethoscope, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

const bookSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  doctorId: z.string().min(1, "Please select a doctor"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time slot"),
  notes: z.string().optional(),
});

export default function PatientAppointments() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);

  const { data: appointments, refetch: refetchAppointments } = useListAppointments({ patientId: user?.id });
  const { data: services } = useListServices();
  const { data: doctors } = useListUsers({ role: "doctor" });

  const form = useForm<z.infer<typeof bookSchema>>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      serviceId: "",
      doctorId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      notes: "",
    },
  });

  const selectedDate = form.watch("date");
  const selectedDoctor = form.watch("doctorId");
  const selectedService = form.watch("serviceId");

  const { data: slots } = useGetAvailableSlots(
    { date: selectedDate, doctorId: Number(selectedDoctor), serviceId: Number(selectedService) },
    {
      query: {
        enabled: !!selectedDate && !!selectedDoctor && !!selectedService,
        queryKey: getGetAvailableSlotsQueryKey({ date: selectedDate, doctorId: Number(selectedDoctor), serviceId: Number(selectedService) })
      }
    }
  );

  const createAppointment = useCreateAppointment();

  const onSubmit = async (values: z.infer<typeof bookSchema>) => {
    try {
      await createAppointment.mutateAsync({
        data: {
          serviceId: Number(values.serviceId),
          doctorId: Number(values.doctorId),
          date: values.date,
          time: values.time,
          notes: values.notes,
        }
      });
      toast({ title: "Appointment booked successfully!" });
      setIsBooking(false);
      form.reset();
      refetchAppointments();
    } catch (error: any) {
      toast({ title: "Failed to book appointment", description: error.message, variant: "destructive" });
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
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          
          <Dialog open={isBooking} onOpenChange={setIsBooking}>
            <DialogTrigger asChild>
              <Button>Book Appointment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Book a New Appointment</DialogTitle>
                <DialogDescription>
                  Select a service, doctor, and an available time slot.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services?.filter(s => s.isActive).map(s => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {language === 'ar' ? s.nameAr : s.name} - ${s.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                          </FormControl>
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
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" min={format(new Date(), "yyyy-MM-dd")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Slot</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={!slots || slots.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {slots?.filter(s => s.available).map(s => (
                                <SelectItem key={s.time} value={s.time}>
                                  {s.time}
                                </SelectItem>
                              ))}
                              {slots && slots.filter(s => s.available).length === 0 && (
                                <SelectItem value="none" disabled>No slots available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Any specific concerns?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createAppointment.isPending}>
                      {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
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
                <p>No appointments found</p>
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
