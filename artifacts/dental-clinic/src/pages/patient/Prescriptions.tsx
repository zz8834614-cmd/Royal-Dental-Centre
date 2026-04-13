import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useListPrescriptions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pill, Printer } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const { data: prescriptions } = useListPrescriptions({ patientId: user!.id });

  return (
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Prescriptions</h1>
        
        <div className="grid gap-6">
          {prescriptions?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Pill className="h-12 w-12 mb-4 opacity-20" />
                <p>No prescriptions found</p>
              </CardContent>
            </Card>
          ) : (
            prescriptions?.map(prescription => (
              <Card key={prescription.id} className="overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Prescription #{prescription.id}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(prescription.createdAt), "MMMM d, yyyy")} • Dr. {prescription.doctorName}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {prescription.items.map((item, idx) => (
                      <div key={idx} className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-full mt-1">
                            <Pill className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{item.medicationName}</h4>
                            <p className="text-sm font-medium">{item.dosage}</p>
                            {item.instructions && (
                              <p className="text-sm text-muted-foreground mt-1">{item.instructions}</p>
                            )}
                          </div>
                        </div>
                        <div className="sm:text-right text-sm space-y-1">
                          <p><span className="text-muted-foreground">Frequency:</span> <span className="font-medium">{item.frequency}</span></p>
                          <p><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{item.duration}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {prescription.notes && (
                    <div className="p-6 bg-muted/30 border-t">
                      <h5 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Doctor's Notes</h5>
                      <p className="text-sm">{prescription.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
