import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Settings, Save, Phone, Mail, MapPin, Globe, Clock } from "lucide-react";
import { getStoredToken } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch(`${BASE}/api/settings`);
  return res.json();
}

async function saveSettings(data: Record<string, string>): Promise<Record<string, string>> {
  const token = getStoredToken();
  const res = await fetch(`${BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-user-id": token || "" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export default function AdminSettings() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clinic_phone: "",
    clinic_email: "",
    clinic_address: "",
    clinic_address_ar: "",
    clinic_whatsapp: "",
    working_hours: "",
    working_hours_ar: "",
    about_en: "",
    about_ar: "",
    mission_en: "",
    mission_ar: "",
    vision_en: "",
    vision_ar: "",
  });

  useEffect(() => {
    fetchSettings().then(data => {
      setForm(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(data).filter(([key]) => key in prev)
        ),
      }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(form);
      toast({ title: isAr ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully" });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            {isAr ? "إعدادات الموقع" : "Site Settings"}
          </h1>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 me-2" />
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الكل" : "Save All")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              {isAr ? "معلومات التواصل" : "Contact Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Phone className="h-3 w-3" />{isAr ? "رقم الهاتف" : "Phone Number"}</Label>
                <Input value={form.clinic_phone} onChange={e => updateField("clinic_phone", e.target.value)} placeholder="+213 XX XXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-3 w-3" />{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <Input value={form.clinic_email} onChange={e => updateField("clinic_email", e.target.value)} placeholder="info@royaldental.com" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-3 w-3" />{isAr ? "واتساب" : "WhatsApp"}</Label>
                <Input value={form.clinic_whatsapp} onChange={e => updateField("clinic_whatsapp", e.target.value)} placeholder="+213XXXXXXXXX" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {isAr ? "العنوان" : "Address & Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "العنوان (إنجليزي)" : "Address (English)"}</Label>
                <Input value={form.clinic_address} onChange={e => updateField("clinic_address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "العنوان (عربي)" : "Address (Arabic)"}</Label>
                <Input value={form.clinic_address_ar} onChange={e => updateField("clinic_address_ar", e.target.value)} dir="rtl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {isAr ? "أوقات العمل" : "Working Hours"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "الأوقات (إنجليزي)" : "Hours (English)"}</Label>
                <Input value={form.working_hours} onChange={e => updateField("working_hours", e.target.value)} placeholder="Sat - Thu: 8:00 AM - 6:00 PM" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "الأوقات (عربي)" : "Hours (Arabic)"}</Label>
                <Input value={form.working_hours_ar} onChange={e => updateField("working_hours_ar", e.target.value)} dir="rtl" placeholder="السبت - الخميس: 8:00 - 18:00" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "صفحة من نحن" : "About Us Page"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isAr ? "نبذة عنّا (إنجليزي)" : "About Us (English)"}</Label>
                <Textarea value={form.about_en} onChange={e => updateField("about_en", e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "نبذة عنّا (عربي)" : "About Us (Arabic)"}</Label>
                <Textarea value={form.about_ar} onChange={e => updateField("about_ar", e.target.value)} rows={4} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "رسالتنا (إنجليزي)" : "Mission (English)"}</Label>
                <Textarea value={form.mission_en} onChange={e => updateField("mission_en", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "رسالتنا (عربي)" : "Mission (Arabic)"}</Label>
                <Textarea value={form.mission_ar} onChange={e => updateField("mission_ar", e.target.value)} rows={3} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "رؤيتنا (إنجليزي)" : "Vision (English)"}</Label>
                <Textarea value={form.vision_en} onChange={e => updateField("vision_en", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "رؤيتنا (عربي)" : "Vision (Arabic)"}</Label>
                <Textarea value={form.vision_ar} onChange={e => updateField("vision_ar", e.target.value)} rows={3} dir="rtl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
