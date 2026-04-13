import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListPrescriptions, useListMedications, useCreatePrescription, useListPatients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Pill, Printer, Download, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function printPrescription(prescription: any, isAr: boolean) {
  const patient = prescription.patientName || "";
  const doctor = prescription.doctorName || "";
  const date = format(new Date(prescription.createdAt), "yyyy-MM-dd HH:mm");
  const items = prescription.items || [];

  const html = `
    <html dir="${isAr ? 'rtl' : 'ltr'}">
    <head><meta charset="utf-8"><title>${isAr ? 'وصفة طبية' : 'Prescription'}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Noto Naskh Arabic', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 3px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
      .header h1 { color: #b8860b; font-size: 28px; margin-bottom: 5px; }
      .header p { color: #666; font-size: 14px; }
      .info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f8f8f8; border-radius: 8px; }
      .info div { }
      .info label { font-weight: bold; color: #b8860b; display: block; font-size: 12px; text-transform: uppercase; }
      .info span { font-size: 16px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th { background: #b8860b; color: white; padding: 12px; text-align: ${isAr ? 'right' : 'left'}; font-size: 14px; }
      td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
      tr:nth-child(even) { background: #fafafa; }
      .notes { padding: 15px; background: #fff8e1; border-radius: 8px; border-left: 4px solid #b8860b; }
      .notes h3 { color: #b8860b; margin-bottom: 8px; }
      .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
      .signature { margin-top: 40px; display: flex; justify-content: flex-end; }
      .signature div { border-top: 2px solid #333; padding-top: 8px; min-width: 200px; text-align: center; }
      @media print { body { padding: 20px; } }
    </style></head>
    <body>
      <div class="header">
        <h1>🦷 ${isAr ? 'مركز رويال لطب الأسنان' : 'Royal Dental Centre'}</h1>
        <p>${isAr ? 'وصفة طبية' : 'Medical Prescription'}</p>
      </div>
      <div class="info">
        <div><label>${isAr ? 'المريض' : 'Patient'}</label><span>${patient}</span></div>
        <div><label>${isAr ? 'الطبيب' : 'Doctor'}</label><span>Dr. ${doctor}</span></div>
        <div><label>${isAr ? 'التاريخ' : 'Date'}</label><span>${date}</span></div>
        <div><label>${isAr ? 'الرقم' : 'Rx No.'}</label><span>#${prescription.id}</span></div>
      </div>
      <table>
        <thead><tr>
          <th>#</th>
          <th>${isAr ? 'الدواء' : 'Medication'}</th>
          <th>${isAr ? 'الجرعة' : 'Dosage'}</th>
          <th>${isAr ? 'التكرار' : 'Frequency'}</th>
          <th>${isAr ? 'المدة' : 'Duration'}</th>
          <th>${isAr ? 'تعليمات' : 'Instructions'}</th>
        </tr></thead>
        <tbody>${items.map((item: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${item.medicationName}</strong></td>
            <td>${item.dosage || '-'}</td>
            <td>${item.frequency || '-'}</td>
            <td>${item.duration || '-'}</td>
            <td>${item.instructions || '-'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${prescription.notes ? `<div class="notes"><h3>${isAr ? 'ملاحظات الطبيب' : "Doctor's Notes"}</h3><p>${prescription.notes}</p></div>` : ''}
      <div class="signature"><div>${isAr ? 'توقيع الطبيب' : "Doctor's Signature"}</div></div>
      <div class="footer">${isAr ? 'مركز رويال لطب الأسنان - الجزائر' : 'Royal Dental Centre - Algeria'}</div>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}

export default function DoctorPrescriptions() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { data: prescriptions, refetch } = useListPrescriptions();
  const { data: patients } = useListPatients();
  const [medSearch, setMedSearch] = useState("");
  const { data: medications } = useListMedications({ search: medSearch });
  const createPrescription = useCreatePrescription();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[]>([]);

  const handleAddMedication = (medName: string) => {
    setItems([...items, { medicationName: medName, dosage: "", frequency: "", duration: "", instructions: "" }]);
    setMedSearch("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedPatientId || items.length === 0) {
      toast({
        title: isAr ? "خطأ في التحقق" : "Validation Error",
        description: isAr ? "اختر المريض وأضف دواء واحد على الأقل" : "Select patient and add at least one medication",
        variant: "destructive"
      });
      return;
    }

    try {
      await createPrescription.mutateAsync({
        data: { patientId: Number(selectedPatientId), items, notes }
      });
      toast({ title: isAr ? "تم إنشاء الوصفة بنجاح" : "Prescription created" });
      setIsCreating(false);
      setSelectedPatientId("");
      setNotes("");
      setItems([]);
      refetch();
    } catch (error: any) {
      toast({ title: isAr ? "فشل الإنشاء" : "Failed to create", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["doctor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "الوصفات الطبية" : "Prescriptions"}
          </h1>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-2" /> {isAr ? "وصفة جديدة" : "New Prescription"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isAr ? "إنشاء وصفة طبية ذكية" : "Create Smart Prescription"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isAr ? "اختر المريض" : "Select Patient"}</label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "ابحث عن المريض..." : "Search patient..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    {isAr ? "البحث عن الأدوية وإضافتها" : "Search & Add Medications"}
                  </h3>
                  <div className="flex gap-2 items-center mb-4">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder={isAr ? "ابحث عن دواء لإضافته..." : "Search medications to add..."}
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                    />
                  </div>
                  {medSearch && medications && medications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                      {medications.map(med => (
                        <Badge
                          key={med.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => handleAddMedication(med.name)}
                        >
                          + {med.name} {med.strength && `(${med.strength})`}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    {items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isAr ? "ابحث عن دواء واضغط عليه لإضافته" : "Search for a medication and click to add it"}
                      </p>
                    )}
                    {items.map((item, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-primary flex items-center gap-2">
                              <Pill className="h-4 w-4" /> {item.medicationName}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Input placeholder={isAr ? "الجرعة" : "Dosage"} value={item.dosage} onChange={e => handleUpdateItem(idx, "dosage", e.target.value)} />
                            <Input placeholder={isAr ? "التكرار" : "Frequency"} value={item.frequency} onChange={e => handleUpdateItem(idx, "frequency", e.target.value)} />
                            <Input placeholder={isAr ? "المدة" : "Duration"} value={item.duration} onChange={e => handleUpdateItem(idx, "duration", e.target.value)} />
                            <Input placeholder={isAr ? "تعليمات" : "Instructions"} value={item.instructions} onChange={e => handleUpdateItem(idx, "instructions", e.target.value)} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{isAr ? "ملاحظات الطبيب" : "Doctor's Notes"}</label>
                  <Textarea placeholder={isAr ? "أي ملاحظات إضافية..." : "Any additional notes..."} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={createPrescription.isPending}>
                    {createPrescription.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الوصفة" : "Save Prescription")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {prescriptions?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "لا توجد وصفات" : "No prescriptions"}</p>
              </CardContent>
            </Card>
          ) : (
            prescriptions?.map(prescription => (
              <Card key={prescription.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{prescription.patientName}</CardTitle>
                    <CardDescription>{format(new Date(prescription.createdAt), "yyyy-MM-dd HH:mm")}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => printPrescription(prescription, isAr)}>
                    <Printer className="h-4 w-4 me-1" />
                    {isAr ? "طباعة" : "Print"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mt-2">
                    {prescription.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 border-b last:border-0 pb-2 last:pb-0">
                        <Pill className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <span className="font-bold">{item.medicationName}</span>
                          <div className="text-muted-foreground">
                            {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {prescription.notes && (
                    <p className="text-sm text-muted-foreground mt-3 bg-muted p-2 rounded">
                      {isAr ? "ملاحظات:" : "Notes:"} {prescription.notes}
                    </p>
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
