import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useListMedicalRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Stethoscope } from "lucide-react";
import { format } from "date-fns";

export default function PatientRecords() {
  const { user } = useAuth();
  const { data: records } = useListMedicalRecords({ patientId: user!.id });

  return (
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>
        
        <div className="grid gap-6">
          {records?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>No medical records found</p>
              </CardContent>
            </Card>
          ) : (
            records?.map(record => (
              <Card key={record.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      Visit on {format(new Date(record.createdAt), "MMMM d, yyyy")}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Dr. {record.doctorName}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-1">Diagnosis</h4>
                      <p>{record.diagnosis}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-1">Treatment</h4>
                      <p>{record.treatment}</p>
                    </div>
                  </div>
                  
                  {(record.notes || record.toothNumber) && (
                    <div className="pt-4 border-t mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                      {record.toothNumber && <span>Tooth Number: {record.toothNumber}</span>}
                      {record.notes && <span>Notes: {record.notes}</span>}
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
