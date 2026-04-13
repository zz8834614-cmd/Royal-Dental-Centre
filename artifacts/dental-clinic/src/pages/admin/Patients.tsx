import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListPatients, useListMedicalRecords, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Search, User as UserIcon, Phone, Mail, Calendar, Activity, Edit, Save } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPatients() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: patients, refetch } = useListPatients({ search });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", medicalHistory: "", allergies: "" });

  const selected = patients?.find(p => p.id === selectedId);
  const { data: records } = useListMedicalRecords(
    { patientId: selectedId! },
    { query: { enabled: !!selectedId } }
  );

  const updateUser = useUpdateUser();

  const startEdit = () => {
    if (!selected) return;
    setEditForm({
      firstName: selected.firstName || "",
      lastName: selected.lastName || "",
      phone: selected.phone || "",
      medicalHistory: (selected as any).medicalHistory || "",
      allergies: (selected as any).allergies || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    try {
      await updateUser.mutateAsync({
        id: String(selectedId),
        data: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      await refetch();
      toast({ title: isAr ? "تم حفظ التعديلات" : "Changes saved" });
      setEditing(false);
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "إدارة المرضى" : "Patient Management"}
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
          {patients?.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              {isAr ? "لم يتم العثور على مرضى" : "No patients found"}
            </div>
          )}
          {patients?.map(patient => (
            <Card
              key={patient.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedId(patient.id)}
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
                    <Mail className="h-3 w-3" /> {patient.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {patient.phone || (isAr ? "غير محدد" : "N/A")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {patient.lastVisit
                      ? format(new Date(patient.lastVisit), "yyyy-MM-dd")
                      : (isAr ? "لا توجد زيارات" : "No visits")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setEditing(false); } }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span className="text-2xl">
                      {editing ? editForm.firstName + " " + editForm.lastName : selected.firstName + " " + selected.lastName}
                    </span>
                    {!editing && (
                      <Button variant="outline" size="sm" onClick={startEdit}>
                        <Edit className="h-4 w-4 me-1" />
                        {isAr ? "تعديل" : "Edit"}
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>

                {editing ? (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{isAr ? "الاسم الأول" : "First Name"}</Label>
                        <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>{isAr ? "اسم العائلة" : "Last Name"}</Label>
                        <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{isAr ? "الهاتف" : "Phone"}</Label>
                      <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEdit}>
                        <Save className="h-4 w-4 me-1" />
                        {isAr ? "حفظ" : "Save"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        {isAr ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        {isAr ? "معلومات التواصل" : "Contact Info"}
                      </h3>
                      <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex gap-2"><Mail className="h-4 w-4" /> {selected.email}</div>
                        <div className="flex gap-2"><Phone className="h-4 w-4" /> {selected.phone || "N/A"}</div>
                        <div className="flex gap-2"><Calendar className="h-4 w-4" /> {isAr ? "تاريخ الميلاد:" : "DOB:"} {selected.dateOfBirth || "N/A"}</div>
                      </div>

                      <h3 className="font-semibold text-lg flex items-center gap-2 mt-4">
                        <Activity className="h-5 w-5" />
                        {isAr ? "التفاصيل الطبية" : "Medical Details"}
                      </h3>
                      <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                        <div>
                          <span className="font-semibold block mb-1">{isAr ? "التاريخ المرضي:" : "Medical History:"}</span>
                          <p>{(selected as any).medicalHistory || (isAr ? "لا يوجد" : "None recorded")}</p>
                        </div>
                        <div>
                          <span className="font-semibold block mb-1">{isAr ? "الحساسية:" : "Allergies:"}</span>
                          <p className="text-destructive font-medium">{(selected as any).allergies || (isAr ? "لا يوجد" : "None known")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        {isAr ? "السجلات الطبية السابقة" : "Past Medical Records"}
                      </h3>
                      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                        {!records || records.length === 0 ? (
                          <p className="text-muted-foreground text-sm italic">
                            {isAr ? "لا توجد سجلات" : "No records found"}
                          </p>
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
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
