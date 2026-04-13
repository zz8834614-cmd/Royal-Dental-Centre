import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListMedicalRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Stethoscope, Activity } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PatientRecords() {
  const { user } = useAuth();
  const { language } = useI18n();
  const isAr = language === "ar";
  const { data: records } = useListMedicalRecords({ patientId: user!.id });

  return (
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "سجلاتي الطبية" : "Medical Records"}
        </h1>

        <div className="grid gap-6">
          {records?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "لا توجد سجلات طبية" : "No medical records found"}</p>
              </CardContent>
            </Card>
          ) : (
            records?.map(record => (
              <Card key={record.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      {isAr ? "زيارة بتاريخ" : "Visit on"} {format(new Date(record.createdAt), "yyyy-MM-dd")}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      Dr. {record.doctorName}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-1">
                        {isAr ? "التشخيص" : "Diagnosis"}
                      </h4>
                      <p>{record.diagnosis}</p>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-1">
                        {isAr ? "العلاج" : "Treatment"}
                      </h4>
                      <p>{record.treatment}</p>
                    </div>
                  </div>

                  {(record.notes || record.toothNumber) && (
                    <div className="pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {record.toothNumber && (
                        <Badge variant="outline">
                          {isAr ? "رقم السن:" : "Tooth:"} {record.toothNumber}
                        </Badge>
                      )}
                      {record.notes && (
                        <span>{isAr ? "ملاحظات:" : "Notes:"} {record.notes}</span>
                      )}
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
