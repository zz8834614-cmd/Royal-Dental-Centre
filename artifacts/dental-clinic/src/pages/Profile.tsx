import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { User, Save, Mail, Phone, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const updateUser = useUpdateUser();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser.mutateAsync({
        id: String(user.id),
        data: { firstName, lastName, phone: phone || undefined },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: isAr ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully" });
    } catch (e: any) {
      toast({ title: isAr ? "حدث خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    patient: isAr ? "مريض" : "Patient",
    doctor: isAr ? "طبيب" : "Doctor",
    admin: isAr ? "مشرف" : "Admin",
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {isAr ? "الملف الشخصي" : "Profile"}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span>{user?.firstName} {user?.lastName}</span>
                <Badge className="ms-3 capitalize" variant="secondary">
                  <Shield className="h-3 w-3 me-1" />
                  {roleLabels[user?.role || "patient"]}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "الاسم الأول" : "First Name"}</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isAr ? "أدخل الاسم الأول" : "Enter first name"}
                />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "اسم العائلة" : "Last Name"}</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? "أدخل اسم العائلة" : "Enter last name"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {isAr ? "البريد الإلكتروني" : "Email"}
              </Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                {isAr ? "لا يمكن تغيير البريد الإلكتروني" : "Email cannot be changed"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {isAr ? "رقم الهاتف" : "Phone"}
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isAr ? "أدخل رقم الهاتف" : "Enter phone number"}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 me-2" />
              {saving
                ? (isAr ? "جاري الحفظ..." : "Saving...")
                : (isAr ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
