import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Stethoscope, User as UserIcon, Pencil, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface EditForm {
  firstName: string;
  lastName: string;
  speciality: string;
  bio: string;
}

export default function AdminTeam() {
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const { data: users, refetch } = useListUsers({}, { query: { refetchInterval: 5000, refetchOnMount: "always", staleTime: 0 } });
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ firstName: "", lastName: "", speciality: "", bio: "" });

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUser.mutateAsync({ id: String(userId), data: { role: newRole } });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await refetch();
      toast({ title: t("admin.roleUpdated") });
    } catch (e: any) {
      toast({ title: t("admin.error"), description: e.message, variant: "destructive" });
    }
  };

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      speciality: user.speciality || "",
      bio: user.bio || "",
    });
  };

  const handleSaveEdit = async (userId: number) => {
    try {
      await updateUser.mutateAsync({
        id: String(userId),
        data: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          speciality: editForm.speciality || null,
          bio: editForm.bio || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await refetch();
      setEditingId(null);
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
    } catch (e: any) {
      toast({ title: t("admin.error"), description: e.message, variant: "destructive" });
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "doctor": return <Stethoscope className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "doctor": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default: return "bg-green-500/10 text-green-600 dark:text-green-400";
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin": return t("admin.admin");
      case "doctor": return t("admin.doctor");
      default: return t("admin.patient");
    }
  };

  const doctors = users?.filter(u => u.role === "doctor" || u.role === "admin") || [];
  const patients = users?.filter(u => u.role === "patient") || [];

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.team")}</h1>
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {users?.length || 0}
          </Badge>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            {t("admin.medicalTeam")}
          </h2>
          <div className="grid gap-3">
            {doctors.map(user => (
              <Card key={user.id} className="group transition-all">
                <CardContent className="p-4">
                  {editingId === user.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {editForm.firstName.charAt(0)}{editForm.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-sm text-muted-foreground">
                          {isAr ? "تعديل بيانات الطبيب" : "Edit doctor profile"}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{isAr ? "الاسم" : "First Name"}</Label>
                          <Input
                            value={editForm.firstName}
                            onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{isAr ? "اللقب" : "Last Name"}</Label>
                          <Input
                            value={editForm.lastName}
                            onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">{isAr ? "التخصص" : "Speciality"}</Label>
                          <Input
                            value={editForm.speciality}
                            onChange={e => setEditForm(f => ({ ...f, speciality: e.target.value }))}
                            placeholder={isAr ? "مثال: أخصائي تقويم الأسنان" : "e.g. Orthodontist"}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">{isAr ? "النبذة التعريفية" : "Bio / Description"}</Label>
                          <Textarea
                            value={editForm.bio}
                            onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                            placeholder={isAr ? "نبذة قصيرة عن الطبيب تظهر في الصفحة الرئيسية..." : "Short bio displayed on the landing page..."}
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(user.id)} disabled={updateUser.isPending} className="gap-1">
                          <Check className="h-3.5 w-3.5" />
                          {isAr ? "حفظ" : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="gap-1">
                          <X className="h-3.5 w-3.5" />
                          {isAr ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                        {user.speciality && (
                          <p className="text-sm text-primary font-medium">{user.speciality}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
                        )}
                        {user.phone && <p className="text-xs text-muted-foreground" dir="ltr">{user.phone}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`gap-1 ${roleColor(user.role)}`}>
                          {roleIcon(user.role)}
                          {roleLabel(user.role)}
                        </Badge>
                        <Button variant="outline" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                            <SelectItem value="doctor">{t("admin.doctor")}</SelectItem>
                            <SelectItem value="patient">{t("admin.patient")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {t("admin.patientsSection")} ({patients.length})
          </h2>
          <div className="grid gap-3">
            {patients.map(user => (
              <Card key={user.id} className="group">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs bg-muted">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{user.firstName} {user.lastName}</h3>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                      <SelectItem value="doctor">{t("admin.doctor")}</SelectItem>
                      <SelectItem value="patient">{t("admin.patient")}</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
