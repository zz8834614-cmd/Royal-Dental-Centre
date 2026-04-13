import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, X, Megaphone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminAnnouncements() {
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const { data: announcements, refetch } = useListAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", titleAr: "", content: "", contentAr: "", type: "news" });

  const handleSave = async () => {
    try {
      await createAnnouncement.mutateAsync({
        data: {
          title: form.title,
          titleAr: form.titleAr || undefined,
          content: form.content,
          contentAr: form.contentAr || undefined,
          type: form.type,
          isActive: true,
        }
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      await refetch();
      toast({ title: t("admin.addedSuccess") });
      setShowForm(false);
      setForm({ title: "", titleAr: "", content: "", contentAr: "", type: "news" });
    } catch (e: any) {
      toast({ title: t("admin.error"), description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAnnouncement.mutateAsync({ id: String(id) });
      await queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      await refetch();
      toast({ title: t("admin.deletedSuccess") });
    } catch (e: any) {
      toast({ title: t("admin.error"), description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin", "doctor"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.announcements")}</h1>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 me-2" />
            {t("admin.addAnnouncement")}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("admin.newAnnouncement")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("admin.title")}</Label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.titleAr")}</Label>
                  <Input value={form.titleAr} onChange={e => setForm({...form, titleAr: e.target.value})} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.content")}</Label>
                  <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.contentAr")}</Label>
                  <Textarea value={form.contentAr} onChange={e => setForm({...form, contentAr: e.target.value})} dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.type")}</Label>
                  <Select value={form.type} onValueChange={val => setForm({...form, type: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">{t("admin.typeNews")}</SelectItem>
                      <SelectItem value="offer">{t("admin.typeOffer")}</SelectItem>
                      <SelectItem value="update">{t("admin.typeUpdate")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave} disabled={!form.title}>{t("admin.save")}</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>{t("admin.cancel")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {announcements?.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{isAr ? (a.titleAr || a.title) : a.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {isAr ? (a.contentAr || a.content) : a.content}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">{a.type}</Badge>
                <Badge variant={a.isActive ? "default" : "secondary"}>
                  {a.isActive ? t("admin.active") : t("admin.inactive")}
                </Badge>
                <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
