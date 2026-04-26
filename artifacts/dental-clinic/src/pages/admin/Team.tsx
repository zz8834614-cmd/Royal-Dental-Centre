import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Stethoscope, User as UserIcon, Pencil, X, Check, UserPlus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function authedFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("royal_dental_token") : null;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { "x-user-id": token } : {}),
    },
  });
}

interface EditForm {
  firstName: string;
  lastName: string;
  speciality: string;
  bio: string;
}

interface AddForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  speciality: string;
  bio: string;
  role: string;
}

export default function AdminTeam() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { user: currentUser } = useAuth();
  const { data: users, refetch } = useListUsers({}, { query: { refetchInterval: 5000, refetchOnMount: "always", staleTime: 0 } });
  const updateUser = useUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ firstName: "", lastName: "", speciality: "", bio: "" });

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ firstName: "", lastName: "", email: "", password: "", phone: "", speciality: "", bio: "", role: "doctor" });
  const [addLoading, setAddLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUser.mutateAsync({ id: String(userId), data: { role: newRole } });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await refetch();
      toast({ title: isAr ? "تم تحديث الدور" : "Role updated" });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
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
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAdd = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.password) {
      toast({ title: isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    setAddLoading(true);
    try {
      const res = await authedFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          email: addForm.email,
          password: addForm.password,
          phone: addForm.phone || undefined,
          role: addForm.role,
          speciality: addForm.speciality || undefined,
          bio: addForm.bio || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await refetch();
      setShowAdd(false);
      setAddForm({ firstName: "", lastName: "", email: "", password: "", phone: "", speciality: "", bio: "", role: "doctor" });
      toast({ title: isAr ? "تمت الإضافة بنجاح" : "Member added successfully" });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await authedFetch(`/api/users/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      await refetch();
      setDeleteId(null);
      toast({ title: isAr ? "تم الحذف بنجاح" : "Deleted successfully" });
    } catch (e: any) {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
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
      case "admin": return isAr ? "مشرف" : "Admin";
      case "doctor": return isAr ? "طبيب" : "Doctor";
      case "receptionist": return isAr ? "موظف استقبال" : "Receptionist";
      default: return isAr ? "مريض" : "Patient";
    }
  };

  const teamMembers = users?.filter(u => u.role === "doctor" || u.role === "admin" || u.role === "receptionist") || [];
  const patients = users?.filter(u => u.role === "patient") || [];

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "إدارة الفريق" : "Team Management"}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {users?.length || 0}
            </Badge>
            <Button size="sm" className="gap-1" onClick={() => setShowAdd(true)}>
              <UserPlus className="h-4 w-4" />
              {isAr ? "إضافة عضو" : "Add Member"}
            </Button>
          </div>
        </div>

        {/* Medical Team */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            {isAr ? "الفريق الطبي والإداري" : "Medical & Admin Team"}
            <span className="text-sm font-normal text-muted-foreground">({teamMembers.length})</span>
          </h2>
          <div className="grid gap-3">
            {teamMembers.map(user => (
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
                          {isAr ? "تعديل بيانات العضو" : "Edit member profile"}
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{isAr ? "الاسم" : "First Name"}</Label>
                          <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{isAr ? "اللقب" : "Last Name"}</Label>
                          <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">{isAr ? "التخصص" : "Speciality"}</Label>
                          <Input value={editForm.speciality} onChange={e => setEditForm(f => ({ ...f, speciality: e.target.value }))} placeholder={isAr ? "مثال: أخصائي تقويم الأسنان" : "e.g. Orthodontist"} className="h-8" />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">{isAr ? "النبذة التعريفية (تظهر في صفحة من نحن)" : "Bio (shown on About Us page)"}</Label>
                          <Textarea value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder={isAr ? "نبذة قصيرة عن العضو..." : "Short bio..."} rows={3} />
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
                        {user.speciality && <p className="text-sm text-primary font-medium">{user.speciality}</p>}
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>}
                        {user.phone && <p className="text-xs text-muted-foreground" dir="ltr">{user.phone}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`gap-1 ${roleColor(user.role)}`}>
                          {roleIcon(user.role)}
                          {roleLabel(user.role)}
                        </Badge>
                        <Button variant="outline" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(user.id)} disabled={user.id === currentUser?.id}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)} disabled={user.id === currentUser?.id}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{isAr ? "مشرف" : "Admin"}</SelectItem>
                            <SelectItem value="doctor">{isAr ? "طبيب" : "Doctor"}</SelectItem>
                            <SelectItem value="receptionist">{isAr ? "موظف استقبال" : "Receptionist"}</SelectItem>
                            <SelectItem value="patient">{isAr ? "مريض" : "Patient"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {teamMembers.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {isAr ? "لا يوجد أعضاء في الفريق بعد" : "No team members yet"}
              </div>
            )}
          </div>
        </div>

        {/* Patients */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {isAr ? "المرضى" : "Patients"}
            <span className="text-sm font-normal text-muted-foreground">({patients.length})</span>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(user.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{isAr ? "مشرف" : "Admin"}</SelectItem>
                        <SelectItem value="doctor">{isAr ? "طبيب" : "Doctor"}</SelectItem>
                        <SelectItem value="receptionist">{isAr ? "موظف استقبال" : "Receptionist"}</SelectItem>
                        <SelectItem value="patient">{isAr ? "مريض" : "Patient"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة عضو جديد للفريق" : "Add New Team Member"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الاسم *" : "First Name *"}</Label>
                <Input value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} placeholder={isAr ? "أحمد" : "John"} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "اللقب *" : "Last Name *"}</Label>
                <Input value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} placeholder={isAr ? "بن علي" : "Doe"} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "البريد الإلكتروني *" : "Email *"}</Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="doctor@royal.com" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "كلمة المرور *" : "Password *"}</Label>
              <Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "رقم الهاتف" : "Phone"}</Label>
              <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+213 5XX XXX XXX" dir="ltr" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "الدور" : "Role"}</Label>
              <Select value={addForm.role} onValueChange={val => setAddForm(f => ({ ...f, role: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">{isAr ? "طبيب" : "Doctor"}</SelectItem>
                  <SelectItem value="admin">{isAr ? "مشرف" : "Admin"}</SelectItem>
                  <SelectItem value="receptionist">{isAr ? "موظف استقبال" : "Receptionist"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "التخصص" : "Speciality"}</Label>
              <Input value={addForm.speciality} onChange={e => setAddForm(f => ({ ...f, speciality: e.target.value }))} placeholder={isAr ? "أخصائي تقويم الأسنان" : "Orthodontist"} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? "النبذة التعريفية (تظهر في صفحة من نحن)" : "Bio (shown on About Us page)"}</Label>
              <Textarea value={addForm.bio} onChange={e => setAddForm(f => ({ ...f, bio: e.target.value }))} placeholder={isAr ? "نبذة قصيرة..." : "Short bio..."} rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAdd} disabled={addLoading} className="gap-1">
              <UserPlus className="h-4 w-4" />
              {addLoading ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? "هل أنت متأكد من حذف هذا العضو؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this member? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading ? (isAr ? "جارٍ الحذف..." : "Deleting...") : (isAr ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
