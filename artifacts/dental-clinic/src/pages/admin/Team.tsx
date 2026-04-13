import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Stethoscope, User as UserIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminTeam() {
  const { t } = useI18n();
  const { data: users, refetch } = useListUsers({}, { query: { refetchInterval: 15000, refetchOnMount: "always" } });
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
              <Card key={user.id} className="group">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.phone && <p className="text-xs text-muted-foreground" dir="ltr">{user.phone}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`gap-1 ${roleColor(user.role)}`}>
                      {roleIcon(user.role)}
                      {roleLabel(user.role)}
                    </Badge>
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
