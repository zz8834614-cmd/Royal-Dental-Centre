import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import {
  useListPrescriptions,
  useUpdatePrescription,
  useDeletePrescription,
  Prescription,
  PrescriptionItem,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pill, FileText, Pencil, Trash2, Printer } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function printPrescription(prescription: Prescription, isAr: boolean) {
  const patient = prescription.patientName || "";
  const doctor = prescription.doctorName || "";
  const date = format(new Date(prescription.createdAt), "yyyy-MM-dd HH:mm");
  const items = prescription.items || [];

  const html = `
    <html dir="${isAr ? "rtl" : "ltr"}">
    <head><meta charset="utf-8"><title>${isAr ? "وصفة طبية" : "Prescription"}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
      .header { text-align: center; border-bottom: 3px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
      .header h1 { color: #b8860b; font-size: 28px; }
      .info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f8f8f8; border-radius: 8px; }
      .info label { font-weight: bold; color: #b8860b; display: block; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      th { background: #b8860b; color: white; padding: 12px; text-align: ${isAr ? "right" : "left"}; }
      td { padding: 12px; border-bottom: 1px solid #eee; }
      .notes { padding: 15px; background: #fff8e1; border-radius: 8px; border-left: 4px solid #b8860b; }
    </style></head>
    <body>
      <div class="header"><h1>🦷 ${isAr ? "مركز رويال لطب الأسنان" : "Royal Dental Centre"}</h1></div>
      <div class="info">
        <div><label>${isAr ? "المريض" : "Patient"}</label><span>${patient}</span></div>
        <div><label>${isAr ? "الطبيب" : "Doctor"}</label><span>Dr. ${doctor}</span></div>
        <div><label>${isAr ? "التاريخ" : "Date"}</label><span>${date}</span></div>
        <div><label>${isAr ? "الرقم" : "Rx No."}</label><span>#${prescription.id}</span></div>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>${isAr ? "الدواء" : "Medication"}</th>
          <th>${isAr ? "الجرعة" : "Dosage"}</th><th>${isAr ? "التكرار" : "Frequency"}</th>
          <th>${isAr ? "المدة" : "Duration"}</th><th>${isAr ? "الكمية" : "Qty"}</th>
          <th>${isAr ? "تعليمات" : "Instructions"}</th>
        </tr></thead>
        <tbody>${items.map((item, i) => `
          <tr>
            <td>${i + 1}</td><td><strong>${item.medicationName}</strong></td>
            <td>${item.dosage || "-"}</td><td>${item.frequency || "-"}</td>
            <td>${item.duration || "-"}</td><td>${item.quantity || "-"}</td>
            <td>${item.instructions || "-"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ${prescription.notes ? `<div class="notes"><h3>${isAr ? "ملاحظات" : "Notes"}</h3><p>${prescription.notes}</p></div>` : ""}
    </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export default function AdminPrescriptions() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();

  const { data: prescriptions, refetch } = useListPrescriptions();
  const updatePrescription = useUpdatePrescription();
  const deletePrescription = useDeletePrescription();

  const [editTarget, setEditTarget] = useState<Prescription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editItems, setEditItems] = useState<PrescriptionItem[]>([]);
  const [editNotes, setEditNotes] = useState("");

  const openEdit = (p: Prescription) => {
    setEditTarget(p);
    setEditItems(p.items.map(i => ({ ...i })));
    setEditNotes(p.notes ?? "");
  };

  const handleUpdateItem = (idx: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...editItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setEditItems(newItems);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    try {
      await updatePrescription.mutateAsync({
        id: editTarget.id,
        data: { items: editItems, notes: editNotes },
      });
      toast({ title: isAr ? "تم تحديث الوصفة" : "Prescription updated" });
      setEditTarget(null);
      refetch();
    } catch (e: any) {
      toast({ title: isAr ? "فشل التحديث" : "Update failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePrescription.mutateAsync({ id });
      toast({ title: isAr ? "تم حذف الوصفة" : "Prescription deleted" });
      setDeleteTarget(null);
      refetch();
    } catch (e: any) {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "جميع الوصفات الطبية" : "All Prescriptions"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAr ? "عرض وإدارة جميع الوصفات" : "View and manage all prescriptions"}
          </p>
        </div>

        {prescriptions?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-20" />
              <p>{isAr ? "لا توجد وصفات" : "No prescriptions"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {prescriptions?.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{p.patientName}</CardTitle>
                    <CardDescription className="text-xs">
                      Dr. {p.doctorName} • {format(new Date(p.createdAt), "yyyy-MM-dd HH:mm")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => printPrescription(p, isAr)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-sm">
                    {p.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 border-b last:border-0 pb-1.5 last:pb-0">
                        <Pill className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        <div>
                          <span className="font-medium">{item.medicationName}</span>
                          {item.quantity && (
                            <Badge variant="outline" className="ms-1 text-xs py-0">{item.quantity}</Badge>
                          )}
                          <div className="text-muted-foreground text-xs">
                            {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                      {isAr ? "ملاحظات:" : "Notes:"} {p.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAr ? `تعديل وصفة - ${editTarget?.patientName}` : `Edit Prescription - ${editTarget?.patientName}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {editItems.map((item, idx) => (
              <Card key={idx} className="border border-muted">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-sm">{item.medicationName}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Input placeholder={isAr ? "الجرعة" : "Dosage"} value={item.dosage} onChange={e => handleUpdateItem(idx, "dosage", e.target.value)} />
                    <Input placeholder={isAr ? "التكرار" : "Frequency"} value={item.frequency} onChange={e => handleUpdateItem(idx, "frequency", e.target.value)} />
                    <Input placeholder={isAr ? "المدة" : "Duration"} value={item.duration} onChange={e => handleUpdateItem(idx, "duration", e.target.value)} />
                    <Input placeholder={isAr ? "الكمية (مثال: 2 علبة)" : "Quantity (e.g. 2 boxes)"} value={item.quantity ?? ""} onChange={e => handleUpdateItem(idx, "quantity", e.target.value)} />
                    <Input className="md:col-span-2" placeholder={isAr ? "تعليمات" : "Instructions"} value={item.instructions ?? ""} onChange={e => handleUpdateItem(idx, "instructions", e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <div>
              <label className="text-sm font-medium">{isAr ? "ملاحظات الطبيب" : "Doctor's Notes"}</label>
              <Textarea className="mt-1" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleSaveEdit} disabled={updatePrescription.isPending}>
                {updatePrescription.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التعديلات" : "Save Changes")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف الوصفة" : "Delete Prescription"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? "هل أنت متأكد من حذف هذه الوصفة؟ لا يمكن التراجع." : "Are you sure? This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
