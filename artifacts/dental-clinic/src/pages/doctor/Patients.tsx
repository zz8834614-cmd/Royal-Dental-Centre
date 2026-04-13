import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListPatients, useListMedicalRecords, useCreateMedicalRecord } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Search, User as UserIcon, Phone, Mail, Calendar, Activity, Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function DoctorPatients() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: patients } = useListPatients({ search }, { query: { refetchInterval: 15000, refetchOnMount: "always" } });
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [recordForm, setRecordForm] = useState({ diagnosis: "", treatment: "", toothNumber: "", notes: "" });

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const { data: records, refetch: refetchRecords } = useListMedicalRecords(
    { patientId: selectedPatientId! },
    { query: { enabled: !!selectedPatientId } }
  );

  const createRecord = useCreateMedicalRecord();

  const handleAddRecord = async () => {
    if (!selectedPatientId || !recordForm.diagnosis || !recordForm.treatment) {
      toast({ title: isAr ? "أكمل الحقول المطلوبة" : "Fill required fields", variant: "destructive" });
      return;
    }
    try {
      await createRecord.mutateAsync({
        data: {
          patientId: selectedPatientId,
          diagnosis: recordForm.diagnosis,
          treatment: recordForm.treatment,
          toothNumber: recordForm.toothNumber || undefined,
          notes: recordForm.notes || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      await refetchRecords();
      toast({ title: isAr ? "تم إضافة السجل بنجاح" : "Record added successfully" });
      setShowAddRecord(false);
      setRecordForm({ diagnosis: "", treatment: "", toothNumber: "", notes: "" });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["doctor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "دليل المرضى" : "Patients Directory"}
          </h1>
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث عن مريض..." : "Search patients..."}
              className="ps-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients?.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              {isAr ? "لم يتم العثور على مرضى" : "No patients found"}
            </div>
          ) : (
            patients?.map(patient => (
              <Card
                key={patient.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => { setSelectedPatientId(patient.id); setShowAddRecord(false); }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {patient.phone || (isAr ? "غير محدد" : "No phone")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {isAr ? "آخر زيارة:" : "Last visit:"} {patient.lastVisit ? format(new Date(patient.lastVisit), "yyyy-MM-dd") : (isAr ? "لا يوجد" : "Never")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!selectedPatientId} onOpenChange={(open) => { if (!open) { setSelectedPatientId(null); setShowAddRecord(false); } }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {selectedPatient && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedPatient.firstName} {selectedPatient.lastName}</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <UserIcon className="h-5 w-5" /> {isAr ? "معلومات التواصل" : "Contact Info"}
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex gap-2"><Mail className="h-4 w-4" /> {selectedPatient.email}</div>
                      <div className="flex gap-2"><Phone className="h-4 w-4" /> {selectedPatient.phone || "N/A"}</div>
                      <div className="flex gap-2"><Calendar className="h-4 w-4" /> {isAr ? "تاريخ الميلاد:" : "DOB:"} {selectedPatient.dateOfBirth || "N/A"}</div>
                    </div>

                    <h3 className="font-semibold text-lg flex items-center gap-2 mt-4">
                      <Activity className="h-5 w-5" /> {isAr ? "التفاصيل الطبية" : "Medical Details"}
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                      <div>
                        <span className="font-semibold block mb-1">{isAr ? "التاريخ المرضي:" : "Medical History:"}</span>
                        <p>{(selectedPatient as any).medicalHistory || (isAr ? "لا يوجد" : "None recorded")}</p>
                      </div>
                      <div>
                        <span className="font-semibold block mb-1">{isAr ? "الحساسية:" : "Allergies:"}</span>
                        <p className="text-destructive font-medium">{(selectedPatient as any).allergies || (isAr ? "لا يوجد" : "None known")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{isAr ? "السجلات الطبية" : "Medical Records"}</h3>
                      <Button size="sm" onClick={() => setShowAddRecord(!showAddRecord)}>
                        <Plus className="h-4 w-4 me-1" />
                        {isAr ? "سجل جديد" : "Add Record"}
                      </Button>
                    </div>

                    {showAddRecord && (
                      <Card className="border-primary">
                        <CardContent className="p-4 space-y-3">
                          <div className="space-y-2">
                            <Label>{isAr ? "التشخيص *" : "Diagnosis *"}</Label>
                            <Input value={recordForm.diagnosis} onChange={e => setRecordForm({ ...recordForm, diagnosis: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>{isAr ? "العلاج *" : "Treatment *"}</Label>
                            <Input value={recordForm.treatment} onChange={e => setRecordForm({ ...recordForm, treatment: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>{isAr ? "رقم السن" : "Tooth #"}</Label>
                              <Input value={recordForm.toothNumber} onChange={e => setRecordForm({ ...recordForm, toothNumber: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
                            <Textarea value={recordForm.notes} onChange={e => setRecordForm({ ...recordForm, notes: e.target.value })} rows={2} />
                          </div>
                          <Button onClick={handleAddRecord} disabled={createRecord.isPending} className="w-full">
                            {createRecord.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ السجل" : "Save Record")}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                      {!records || records.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{isAr ? "لا توجد سجلات" : "No records found"}</p>
                        </div>
                      ) : (
                        records.map(record => (
                          <div key={record.id} className="border p-3 rounded-lg bg-card text-sm">
                            <div className="flex justify-between font-semibold mb-2">
                              <span>{format(new Date(record.createdAt), "yyyy-MM-dd")}</span>
                              <span>Dr. {record.doctorName}</span>
                            </div>
                            <div className="space-y-1">
                              <p><span className="font-medium">{isAr ? "التشخيص:" : "Diagnosis:"}</span> {record.diagnosis}</p>
                              <p><span className="font-medium">{isAr ? "العلاج:" : "Treatment:"}</span> {record.treatment}</p>
                              {record.toothNumber && <p><span className="font-medium">{isAr ? "السن:" : "Tooth:"}</span> {record.toothNumber}</p>}
                              {record.notes && <p className="text-muted-foreground">{record.notes}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
