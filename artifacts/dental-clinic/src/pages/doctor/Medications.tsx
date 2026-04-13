import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListMedications, useCreateMedication, useDeleteMedication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Trash2, Search, Pill, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const categories = [
  { value: "antibiotic", en: "Antibiotic", ar: "مضاد حيوي" },
  { value: "painkiller", en: "Painkiller", ar: "مسكن" },
  { value: "anti_inflammatory", en: "Anti-inflammatory", ar: "مضاد التهاب" },
  { value: "antiseptic", en: "Antiseptic", ar: "مطهر" },
  { value: "anesthetic", en: "Anesthetic", ar: "مخدر" },
  { value: "vitamin", en: "Vitamin", ar: "فيتامين" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export default function DoctorMedications() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "antibiotic",
    dosageForm: "",
    strength: "",
    description: "",
  });

  const { data: medications, refetch } = useListMedications({ search });
  const createMed = useCreateMedication();
  const deleteMed = useDeleteMedication();

  const handleAdd = async () => {
    if (!form.name) {
      toast({ title: isAr ? "أدخل اسم الدواء" : "Enter medication name", variant: "destructive" });
      return;
    }
    try {
      await createMed.mutateAsync({
        data: {
          name: form.name,
          category: form.category,
          dosageForm: form.dosageForm || undefined,
          strength: form.strength || undefined,
          description: form.description || undefined,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      await refetch();
      toast({ title: isAr ? "تمت إضافة الدواء بنجاح" : "Medication added successfully" });
      setForm({ name: "", category: "antibiotic", dosageForm: "", strength: "", description: "" });
      setShowForm(false);
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMed.mutateAsync({ id: String(id) });
      await queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      await refetch();
      toast({ title: isAr ? "تم حذف الدواء" : "Medication deleted" });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = categories.find(c => c.value === cat);
    return found ? (isAr ? found.ar : found.en) : cat;
  };

  return (
    <DashboardLayout allowedRoles={["doctor", "admin"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "قاعدة بيانات الأدوية" : "Medication Database"}
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث عن دواء..." : "Search medications..."}
                className="ps-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 me-1" />
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isAr ? "إضافة دواء جديد" : "Add New Medication"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isAr ? "اسم الدواء" : "Medication Name"}</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "التصنيف" : "Category"}</Label>
                  <Select value={form.category} onValueChange={val => setForm({ ...form, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value}>{isAr ? c.ar : c.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "شكل الجرعة" : "Dosage Form"}</Label>
                  <Input value={form.dosageForm} onChange={e => setForm({ ...form, dosageForm: e.target.value })} placeholder={isAr ? "أقراص، كبسولات، شراب..." : "Tablet, Capsule, Syrup..."} />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? "التركيز" : "Strength"}</Label>
                  <Input value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} placeholder="500mg, 250mg..." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{isAr ? "الوصف" : "Description"}</Label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAdd} disabled={createMed.isPending}>
                  {createMed.isPending ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة الدواء" : "Add Medication")}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {medications?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Pill className="h-12 w-12 mb-4 opacity-20" />
                <p>{isAr ? "لا توجد أدوية" : "No medications found"}</p>
              </CardContent>
            </Card>
          ) : (
            medications?.map(med => (
              <Card key={med.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{med.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {med.strength && <span className="text-xs text-muted-foreground">{med.strength}</span>}
                      {med.dosageForm && <span className="text-xs text-muted-foreground">• {med.dosageForm}</span>}
                      {med.description && <span className="text-xs text-muted-foreground">• {med.description}</span>}
                    </div>
                  </div>
                  <Badge variant="outline">{getCategoryLabel(med.category)}</Badge>
                  <Button variant="outline" size="icon" className="text-destructive shrink-0" onClick={() => handleDelete(med.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
