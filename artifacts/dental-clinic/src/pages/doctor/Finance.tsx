import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, Clock, AlertCircle, Plus, Search,
  Receipt, CreditCard, Banknote, ChevronRight, Printer, TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Payment {
  id: number;
  amount: number;
  method: string;
  notes: string | null;
  receiverName: string | null;
  paymentDate: string;
}

interface Invoice {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  createdByName: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "partial" | "paid" | "cancelled";
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
}

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  partial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabel: Record<string, { ar: string; en: string }> = {
  pending: { ar: "معلّق", en: "Pending" },
  partial: { ar: "جزئي", en: "Partial" },
  paid: { ar: "مدفوع", en: "Paid" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

const methodLabel: Record<string, { ar: string; en: string }> = {
  cash: { ar: "نقد", en: "Cash" },
  card: { ar: "بطاقة", en: "Card" },
  insurance: { ar: "تأمين", en: "Insurance" },
  other: { ar: "أخرى", en: "Other" },
};

export default function DoctorFinance() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [createForm, setCreateForm] = useState({
    patientId: "",
    description: "",
    totalAmount: "",
    paidAmount: "",
    paymentMethod: "cash",
    notes: "",
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return apiFetch(`/api/invoices?${params}`);
    },
    refetchInterval: 10000,
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    queryFn: () => apiFetch("/api/patients"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) =>
      apiFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          patientId: Number(data.patientId),
          description: data.description,
          totalAmount: Number(data.totalAmount),
          paidAmount: Number(data.paidAmount || 0),
          paymentMethod: data.paymentMethod,
          notes: data.notes || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowCreateDialog(false);
      setCreateForm({ patientId: "", description: "", totalAmount: "", paidAmount: "", paymentMethod: "cash", notes: "" });
      toast({ title: isAr ? "تم إنشاء الفاتورة بنجاح" : "Invoice created successfully" });
    },
  });

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    return inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.description.toLowerCase().includes(search.toLowerCase()) ||
      String(inv.id).includes(search);
  });

  const totalVal = Number(createForm.totalAmount || 0);
  const paidVal = Number(createForm.paidAmount || 0);
  const remainingVal = Math.max(0, totalVal - paidVal);

  const printInvoice = (inv: Invoice) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `
      <!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}">
      <head><meta charset="UTF-8"><title>${isAr ? "فاتورة" : "Invoice"} #${inv.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #000; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 4px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 32px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px 14px; border: 1px solid #ddd; text-align: ${isAr ? "right" : "left"}; }
        th { background: #f5f5f5; }
        .summary { margin-top: 24px; border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; }
        .row.highlight { font-weight: bold; color: ${inv.remainingAmount > 0 ? "#e53e3e" : "#38a169"}; }
        @media print { body { padding: 20px; } }
      </style></head>
      <body>
      <h1>${isAr ? "مركز رويال للأسنان" : "Royal Dental Centre"}</h1>
      <p class="subtitle">${isAr ? "فاتورة رقم" : "Invoice #"}${inv.id}</p>
      <div class="summary">
        <div class="row"><span>${isAr ? "المريض:" : "Patient:"}</span><span>${inv.patientName}</span></div>
        ${inv.patientPhone ? `<div class="row"><span>${isAr ? "الهاتف:" : "Phone:"}</span><span>${inv.patientPhone}</span></div>` : ""}
        <div class="row"><span>${isAr ? "الوصف:" : "Description:"}</span><span>${inv.description}</span></div>
        <div class="row"><span>${isAr ? "التاريخ:" : "Date:"}</span><span>${format(new Date(inv.createdAt), "dd/MM/yyyy")}</span></div>
        <hr/>
        <div class="row"><span>${isAr ? "الإجمالي:" : "Total:"}</span><span>${inv.totalAmount.toFixed(2)} ${isAr ? "د.ج" : "DZD"}</span></div>
        <div class="row"><span>${isAr ? "المدفوع:" : "Paid:"}</span><span style="color:#38a169">${inv.paidAmount.toFixed(2)} ${isAr ? "د.ج" : "DZD"}</span></div>
        <div class="row highlight"><span>${isAr ? "المتبقي:" : "Remaining:"}</span><span>${inv.remainingAmount.toFixed(2)} ${isAr ? "د.ج" : "DZD"}</span></div>
      </div>
      ${inv.payments.length > 0 ? `
      <h3>${isAr ? "سجل الدفعات" : "Payment History"}</h3>
      <table>
        <thead><tr>
          <th>${isAr ? "المبلغ" : "Amount"}</th>
          <th>${isAr ? "الطريقة" : "Method"}</th>
          <th>${isAr ? "التاريخ" : "Date"}</th>
        </tr></thead>
        <tbody>${inv.payments.map((p) => `
          <tr>
            <td>${Number(p.amount).toFixed(2)} ${isAr ? "د.ج" : "DZD"}</td>
            <td>${methodLabel[p.method]?.[isAr ? "ar" : "en"] ?? p.method}</td>
            <td>${format(new Date(p.paymentDate), "dd/MM/yyyy HH:mm")}</td>
          </tr>`).join("")}
        </tbody>
      </table>` : ""}
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {isAr ? "الفواتير والمحاسبة" : "Invoices & Billing"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "إنشاء وعرض فواتير المرضى" : "Create and view patient invoices"}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? "فاتورة جديدة" : "New Invoice"}
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "all", label: isAr ? "الكل" : "All" },
            { key: "pending", label: isAr ? "معلّقة" : "Pending" },
            { key: "partial", label: isAr ? "جزئية" : "Partial" },
            { key: "paid", label: isAr ? "مدفوعة" : "Paid" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`rounded-lg border p-3 text-start transition-all ${
                statusFilter === item.key
                  ? "border-primary bg-primary/5 font-semibold"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="text-sm font-medium">{item.label}</p>
            </button>
          ))}
        </div>

        {/* Invoice List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={isAr ? "بحث عن مريض أو وصف..." : "Search patient or description..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Clock className="h-5 w-5 animate-spin me-2" />
                {isAr ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Receipt className="h-10 w-10 mb-2 opacity-20" />
                <p>{isAr ? "لا توجد فواتير" : "No invoices found"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{isAr ? "المريض" : "Patient"}</TableHead>
                    <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    <TableHead className="text-end">{isAr ? "الإجمالي" : "Total"}</TableHead>
                    <TableHead className="text-end">{isAr ? "المدفوع" : "Paid"}</TableHead>
                    <TableHead className="text-end">{isAr ? "المتبقي" : "Remaining"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{inv.id}</TableCell>
                      <TableCell className="font-medium">{inv.patientName}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{inv.description}</TableCell>
                      <TableCell className="text-end font-mono">{inv.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-end font-mono text-green-600">{inv.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className={`text-end font-mono font-semibold ${inv.remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {inv.remainingAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[inv.status]}`}>
                          {statusLabel[inv.status]?.[isAr ? "ar" : "en"]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(inv.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Detail Dialog — View + Print */}
      {selectedInvoice && (
        <Dialog open={true} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {isAr ? "فاتورة رقم" : "Invoice #"}{selectedInvoice.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "المريض:" : "Patient:"}</span>
                  <span className="font-semibold">{selectedInvoice.patientName}</span>
                </div>
                {selectedInvoice.patientPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isAr ? "الهاتف:" : "Phone:"}</span>
                    <span>{selectedInvoice.patientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "الوصف:" : "Description:"}</span>
                  <span className="text-end max-w-[220px]">{selectedInvoice.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "التاريخ:" : "Date:"}</span>
                  <span>{format(new Date(selectedInvoice.createdAt), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{isAr ? "الحالة:" : "Status:"}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[selectedInvoice.status]}`}>
                    {statusLabel[selectedInvoice.status]?.[isAr ? "ar" : "en"]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">{isAr ? "الإجمالي" : "Total"}</p>
                  <p className="font-bold">{selectedInvoice.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-2">
                  <p className="text-xs text-muted-foreground">{isAr ? "المدفوع" : "Paid"}</p>
                  <p className="font-bold text-green-600">{selectedInvoice.paidAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                </div>
                <div className={`rounded-lg border p-2 ${selectedInvoice.remainingAmount > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "border-green-200 bg-green-50 dark:bg-green-950/20"}`}>
                  <p className="text-xs text-muted-foreground">{isAr ? "المتبقي" : "Remaining"}</p>
                  <p className={`font-bold ${selectedInvoice.remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                    {selectedInvoice.remainingAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                </div>
              </div>

              {selectedInvoice.payments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {isAr ? "سجل الدفعات" : "Payment History"}
                  </h3>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Banknote className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-semibold text-green-600">
                              +{Number(p.amount).toLocaleString()} {isAr ? "د.ج" : "DZD"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {methodLabel[p.method]?.[isAr ? "ar" : "en"]}
                              {p.receiverName ? ` · ${p.receiverName}` : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(p.paymentDate), "dd/MM/yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => printInvoice(selectedInvoice)} className="gap-2">
                <Printer className="h-4 w-4" />
                {isAr ? "طباعة" : "Print"}
              </Button>
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                {isAr ? "إغلاق" : "Close"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {isAr ? "إنشاء فاتورة مخصصة" : "Create Custom Invoice"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{isAr ? "المريض" : "Patient"}</Label>
              <Select
                value={createForm.patientId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, patientId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر المريض..." : "Select patient..."} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "وصف الخدمة / العلاج" : "Description / Treatment"}</Label>
              <Textarea
                placeholder={isAr ? "مثال: تركيب تاج، حشو، خلع..." : "e.g. Crown, filling, extraction..."}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "السعر الإجمالي (د.ج)" : "Total Price (DZD)"}</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={createForm.totalAmount}
                onChange={(e) => setCreateForm((f) => ({ ...f, totalAmount: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? "المبلغ المدفوع الآن (د.ج)" : "Amount Paid Now (DZD)"}</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={createForm.paidAmount}
                onChange={(e) => setCreateForm((f) => ({ ...f, paidAmount: e.target.value }))}
              />
            </div>

            {/* طريقة الدفع — تظهر فقط لو في مبلغ مدفوع */}
            {paidVal > 0 && (
              <div className="space-y-1.5">
                <Label>{isAr ? "طريقة الدفع" : "Payment Method"}</Label>
                <Select
                  value={createForm.paymentMethod}
                  onValueChange={(v) => setCreateForm((f) => ({ ...f, paymentMethod: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{isAr ? "نقد" : "Cash"}</SelectItem>
                    <SelectItem value="card">{isAr ? "بطاقة" : "Card"}</SelectItem>
                    <SelectItem value="insurance">{isAr ? "تأمين" : "Insurance"}</SelectItem>
                    <SelectItem value="other">{isAr ? "أخرى" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ملخص مباشر */}
            {totalVal > 0 && (
              <div className="rounded-lg border p-3 bg-muted/40 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "الإجمالي:" : "Total:"}</span>
                  <span className="font-semibold">{totalVal.toLocaleString()} {isAr ? "د.ج" : "DZD"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "المدفوع:" : "Paid:"}</span>
                  <span className="font-semibold text-green-600">{paidVal.toLocaleString()} {isAr ? "د.ج" : "DZD"}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">{isAr ? "المتبقي:" : "Remaining:"}</span>
                  <span className={`font-bold text-base ${remainingVal > 0 ? "text-red-600" : "text-green-600"}`}>
                    {remainingVal.toLocaleString()} {isAr ? "د.ج" : "DZD"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "الحالة:" : "Status:"}</span>
                  <Badge variant="outline" className={
                    remainingVal === 0 ? "border-green-400 text-green-600" :
                    paidVal > 0 ? "border-blue-400 text-blue-600" :
                    "border-yellow-400 text-yellow-600"
                  }>
                    {remainingVal === 0
                      ? (isAr ? "مدفوع" : "Paid")
                      : paidVal > 0
                      ? (isAr ? "جزئي" : "Partial")
                      : (isAr ? "معلّق" : "Pending")}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
              <Textarea
                rows={2}
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={
                !createForm.patientId ||
                !createForm.description ||
                !createForm.totalAmount ||
                createMutation.isPending
              }
            >
              {createMutation.isPending
                ? (isAr ? "جاري الحفظ..." : "Saving...")
                : (isAr ? "حفظ الفاتورة" : "Save Invoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
