import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListServices, useCreateService, useUpdateService, useDeleteService } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X, Stethoscope } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ServiceForm {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  duration: string;
}

const emptyForm: ServiceForm = { name: "", nameAr: "", description: "", descriptionAr: "", price: "", duration: "" };

export default function AdminServices() {
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const { data: services, refetch } = useListServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const handleSave = async () => {
    try {
      const data = {
        name: form.name,
        nameAr: form.nameAr || undefined,
        description: form.description,
        descriptionAr: form.descriptionAr || undefined,
        price: form.price ? parseFloat(form.price) : undefined,
        duration: form.duration ? parseInt(form.duration) : undefined,
      };

      if (editingId) {
        await updateService.mutateAsync({ id: String(editingId), data });
      } else {
        await createService.mutateAsync({ data });
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      await refetch();
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (e: any) {
      toast({ title: isAr ? "حدث خطأ" : "Error occurred", description: e.message, variant: "destructive" });
    }
  };

  const handleEdit = (service: any) => {
    setForm({
      name: service.name || "",
      nameAr: service.nameAr || "",
      description: service.description || "",
      descriptionAr: service.descriptionAr || "",
      price: service.price ? String(service.price) : "",
      duration: service.duration ? String(service.duration) : "",
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteService.mutateAsync({ id: String(id) });
      await queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      await refetch();
      toast({ title: isAr ? "تم الحذف بنجاح" : "Deleted successfully" });
    } catch (e: any) {
      toast({ title: isAr ? "حدث خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin", "doctor"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.services")}</h1>
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 me-2" />
            {t("admin.addService")}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? t("admin.editService") : t("admin.addService")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("admin.serviceName")}</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.serviceNameAr")}</Label>
                  <Input value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.description")}</Label>
                  <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.descriptionAr")}</Label>
                  <Textarea value={form.descriptionAr} onChange={e => setForm({...form, descriptionAr: e.target.value})} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.price")}</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.duration")}</Label>
                  <Input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} dir="ltr" />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave} disabled={!form.name}>
                  {t("admin.save")}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  {t("admin.cancel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {services?.map(service => (
            <Card key={service.id} className="group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{isAr ? (service.nameAr || service.name) : service.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {isAr ? (service.descriptionAr || service.description) : service.description}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    {service.price && <span>{service.price} DZD</span>}
                    {service.duration && <span>{service.duration} min</span>}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(service)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
