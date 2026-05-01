import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useListPatients, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  Search,
  UserPlus,
  Users,
  Phone,
  Mail,
  Star,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const BLANK_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  password: "",
};

export default function ReceptionistPatients() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const { data: patients, refetch } = useListPatients(
    { search },
    { query: { refetchInterval: 10000, staleTime: 0 } }
  );

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...BLANK_FORM });
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "" });
  const updateUser = useUpdateUser();

  const handleAdd = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.password) {
      toast({ title: isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Fill all required fields", variant: "destructive" });
      return;
    }
    setAdding(true);
    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ ...addForm, role: "patient" }),
      });
      toast({ title: isAr ? "تم إضافة المريض بنجاح" : "Patient added successfully" });
      setShowAdd(false);
      setAddForm({ ...BLANK_FORM });
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      refetch();
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "";
      toast({
        title: msg.includes("already") ? (isAr ? "البريد الإلكتروني مستخدم مسبقاً" : "Email already registered") : (isAr ? "فشل الإضافة" : "Failed to add"),
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setEditForm({ firstName: p.firstName, lastName: p.lastName, phone: p.phone || "" });
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      await updateUser.mutateAsync({ id: String(editId), data: editForm });
      toast({ title: isAr ? "تم تحديث بيانات المريض" : "Patient updated" });
      setEditId(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      refetch();
    } catch {
      toast({ title: isAr ? "فشل التحديث" : "Update failed", variant: "destructive" });
    }
  };

  const toggleSubscription = async (p: any) => {
    try {
      await updateUser.mutateAsync({ id: String(p.id), data: { isSubscribed: !p.isSubscribed } });
      toast({
        title: p.isSubscribed
          ? (isAr ? "تم إلغاء الاشتراك" : "Subscription removed")
          : (isAr ? "تم تفعيل الاشتراك" : "Subscription activated"),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      refetch();
    } catch {
      toast({ title: isAr ? "فشل التحديث" : "Failed", variant: "destructive" });
    }
  };

  const filtered = (patients ?? []).filter(p =>
    !search ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone ?? "").includes(search)
  );

  return (
    <DashboardLayout allowedRoles={["receptionist"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isAr ? "إدارة المرضى" : "Patient Management"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr ? `${filtered.length} مريض مسجل` : `${filtered.length} registered patients`}
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {isAr ? "إضافة مريض جديد" : "Add New Patient"}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={isAr ? "البحث بالاسم أو البريد أو الهاتف..." : "Search by name, email or phone..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{isAr ? "لا يوجد مرضى" : "No patients found"}</p>
            </div>
          ) : (
            filtered.map(p => (
              <Card key={p.id} className="group">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.firstName} {p.lastName}</p>
                        {p.isSubscribed && (
                          <Badge variant="secondary" className="text-xs gap-1 mt-0.5">
                            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                            {isAr ? "مشترك" : "Subscribed"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => startEdit(p)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {p.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1.5 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 h-7 text-xs ${p.isSubscribed ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50" : ""}`}
                      onClick={() => toggleSubscription(p)}
                    >
                      <Star className={`h-3 w-3 me-1 ${p.isSubscribed ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      {p.isSubscribed
                        ? (isAr ? "إلغاء الاشتراك" : "Unsubscribe")
                        : (isAr ? "تفعيل الاشتراك" : "Subscribe")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة مريض جديد" : "Add New Patient"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الاسم الأول *" : "First Name *"}</Label>
                <Input value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "اسم العائلة *" : "Last Name *"}</Label>
                <Input value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? "كلمة المرور *" : "Password *"}</Label>
              <Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder={isAr ? "كلمة مرور مبدئية" : "Initial password"} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
              <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? "تاريخ الميلاد" : "Date of Birth"}</Label>
              <Input type="date" value={addForm.dateOfBirth} onChange={e => setAddForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "إضافة المريض" : "Add Patient")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={editId !== null} onOpenChange={() => setEditId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "تعديل بيانات المريض" : "Edit Patient"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الاسم الأول" : "First Name"}</Label>
                <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "اسم العائلة" : "Last Name"}</Label>
                <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditId(null)}>
              <X className="h-4 w-4 me-1" />{isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={saveEdit} disabled={updateUser.isPending}>
              <Save className="h-4 w-4 me-1" />{isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
