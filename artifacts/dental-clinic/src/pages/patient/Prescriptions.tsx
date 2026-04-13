import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useListPrescriptions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

function printPrescription(prescription: any, isAr: boolean) {
  const html = `
    <html dir="${isAr ? 'rtl' : 'ltr'}">
    <head><meta charset="utf-8"><title>${isAr ? 'وصفة طبية' : 'Prescription'}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Noto Naskh Arabic', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 3px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
      .header h1 { color: #b8860b; font-size: 28px; }
      .info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f8f8f8; border-radius: 8px; }
      .info label { font-weight: bold; color: #b8860b; display: block; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th { background: #b8860b; color: white; padding: 12px; text-align: ${isAr ? 'right' : 'left'}; }
      td { padding: 12px; border-bottom: 1px solid #eee; }
      .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
      @media print { body { padding: 20px; } }
    </style></head>
    <body>
      <div class="header"><h1>🦷 ${isAr ? 'مركز رويال لطب الأسنان' : 'Royal Dental Centre'}</h1>
      <p>${isAr ? 'وصفة طبية' : 'Medical Prescription'}</p></div>
      <div class="info">
        <div><label>${isAr ? 'المريض' : 'Patient'}</label><span>${prescription.patientName}</span></div>
        <div><label>${isAr ? 'الطبيب' : 'Doctor'}</label><span>Dr. ${prescription.doctorName}</span></div>
        <div><label>${isAr ? 'التاريخ' : 'Date'}</label><span>${format(new Date(prescription.createdAt), "yyyy-MM-dd")}</span></div>
      </div>
      <table><thead><tr>
        <th>#</th><th>${isAr ? 'الدواء' : 'Medication'}</th><th>${isAr ? 'الجرعة' : 'Dosage'}</th>
        <th>${isAr ? 'التكرار' : 'Frequency'}</th><th>${isAr ? 'المدة' : 'Duration'}</th>
      </tr></thead><tbody>
      ${prescription.items.map((item: any, i: number) => `<tr><td>${i + 1}</td><td><strong>${item.medicationName}</strong></td><td>${item.dosage || '-'}</td><td>${item.frequency || '-'}</td><td>${item.duration || '-'}</td></tr>`).join('')}
      </tbody></table>
      ${prescription.notes ? `<div style="padding:15px;background:#fff8e1;border-radius:8px;border-left:4px solid #b8860b"><strong>${isAr ? 'ملاحظات' : 'Notes'}:</strong> ${prescription.notes}</div>` : ''}
      <div class="footer">${isAr ? 'مركز رويال لطب الأسنان' : 'Royal Dental Centre'}</div>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const { language } = useI18n();
  const isAr = language === "ar";
  const { data: prescriptions } = useListPrescriptions({ patientId: user!.id });

  return (
    <DashboardLayout allowedRoles={["patient"]}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "وصفاتي الطبية" : "My Prescriptions"}
        </h1>

        <div className="grid gap-6">
          {prescriptions?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Pill className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "لا توجد وصفات طبية" : "No prescriptions found"}</p>
              </CardContent>
            </Card>
          ) : (
            prescriptions?.map(prescription => (
              <Card key={prescription.id} className="overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">
                      {isAr ? `وصفة #${prescription.id}` : `Prescription #${prescription.id}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(prescription.createdAt), "yyyy-MM-dd")} • Dr. {prescription.doctorName}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => printPrescription(prescription, isAr)}>
                    <Printer className="h-4 w-4 me-1" />
                    {isAr ? "طباعة" : "Print"}
                  </Button>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {prescription.items.map((item: any, idx: number) => (
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
                        <div className="sm:text-end text-sm space-y-1">
                          <p><span className="text-muted-foreground">{isAr ? "التكرار:" : "Frequency:"}</span> <span className="font-medium">{item.frequency}</span></p>
                          <p><span className="text-muted-foreground">{isAr ? "المدة:" : "Duration:"}</span> <span className="font-medium">{item.duration}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {prescription.notes && (
                    <div className="p-6 bg-muted/30 border-t">
                      <h5 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {isAr ? "ملاحظات الطبيب" : "Doctor's Notes"}
                      </h5>
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
