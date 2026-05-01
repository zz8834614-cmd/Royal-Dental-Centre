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
import { Separator } from "@/components/ui/separator";
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
  DollarSign, TrendingUp, Clock, AlertCircle, Plus, Search,
  Receipt, CreditCard, Banknote, ChevronRight, Printer, X,
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

interface Summary {
  todayIncome: number;
  monthIncome: number;
  totalRevenue: number;
  outstandingAmount: number;
  invoiceCounts: { pending: number; partial: number; paid: number; total: number };
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

export default function Finance() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const qc = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [createForm, setCreateForm] = useState({
    patientId: "",
    description: "",
    totalAmount: "",
    notes: "",
    dueDate: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "cash",
    notes: "",
  });

  const { data: summary } = useQuery<Summary>({
    queryKey: ["/api/invoices/summary"],
    queryFn: () => apiFetch("/api/invoices/summary").then((r) => r.json()),
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      return apiFetch(`/api/invoices?${params}`).then((r) => r.json());
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    queryFn: () => apiFetch("/api/patients").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) =>
      apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: Number(data.patientId),
          description: data.description,
          totalAmount: Number(data.totalAmount),
          notes: data.notes || undefined,
          dueDate: data.dueDate || undefined,
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
      setShowCreateDialog(false);
      setCreateForm({ patientId: "", description: "", totalAmount: "", notes: "", dueDate: "" });
      toast({ title: isAr ? "تم إنشاء الفاتورة" : "Invoice created" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: { invoiceId: number; amount: number; method: string; notes: string }) =>
      apiFetch(`/api/invoices/${data.invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.amount, method: data.method, notes: data.notes }),
      }).then((r) => r.json()),
    onSuccess: (updated: Invoice) => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      qc.invalidateQueries({ queryKey: ["/api/invoices/summary"] });
      setSelectedInvoice(updated);
      setShowPaymentDialog(false);
      setPaymentForm({ amount: "", method: "cash", notes: "" });
      toast({ title: isAr ? "تم تسجيل الدفعة" : "Payment recorded" });
    },
  });

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    return inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.description.toLowerCase().includes(search.toLowerCase()) ||
      String(inv.id).includes(search);
  });

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
        .total-row td { font-weight: bold; background: #fafafa; }
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
        ${inv.dueDate ? `<div class="row"><span>${isAr ? "تاريخ الاستحقاق:" : "Due:"}</span><span>${format(new Date(inv.dueDate), "dd/MM/yyyy")}</span></div>` : ""}
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
          <th>${isAr ? "ملاحظات" : "Notes"}</th>
        </tr></thead>
        <tbody>${inv.payments.map((p) => `
          <tr>
            <td>${Number(p.amount).toFixed(2)} ${isAr ? "د.ج" : "DZD"}</td>
            <td>${methodLabel[p.method]?.[isAr ? "ar" : "en"] ?? p.method}</td>
            <td>${format(new Date(p.paymentDate), "dd/MM/yyyy HH:mm")}</td>
            <td>${p.notes ?? "-"}</td>
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
              {isAr ? "إدارة المحاسبة والمالية" : "Financial Management"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "تتبع الفواتير والمدفوعات والأرباح" : "Track invoices, payments, and revenue"}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? "فاتورة جديدة" : "New Invoice"}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "إيراد اليوم" : "Today"}</p>
                  <p className="text-lg font-bold text-green-600">
                    {(summary?.todayIncome ?? 0).toLocaleString()} {isAr ? "د.ج" : "DZD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "إيراد الشهر" : "This Month"}</p>
                  <p className="text-lg font-bold text-blue-600">
                    {(summary?.monthIncome ?? 0).toLocaleString()} {isAr ? "د.ج" : "DZD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                  <p className="text-lg font-bold text-purple-600">
                    {(summary?.totalRevenue ?? 0).toLocaleString()} {isAr ? "د.ج" : "DZD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "مستحق التحصيل" : "Outstanding"}</p>
                  <p className="text-lg font-bold text-red-600">
                    {(summary?.outstandingAmount ?? 0).toLocaleString()} {isAr ? "د.ج" : "DZD"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "all", label: isAr ? "الكل" : "All", count: summary?.invoiceCounts.total ?? 0 },
            { key: "pending", label: isAr ? "معلّقة" : "Pending", count: summary?.invoiceCounts.pending ?? 0 },
            { key: "partial", label: isAr ? "جزئية" : "Partial", count: summary?.invoiceCounts.partial ?? 0 },
            { key: "paid", label: isAr ? "مدفوعة" : "Paid", count: summary?.invoiceCounts.paid ?? 0 },
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
              <p className="text-2xl font-bold">{item.count}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </button>
          ))}
        </div>

        {/* Invoice List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={isAr ? "بحث عن مريض أو وصف..." : "Search patient or description..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{inv.description}</TableCell>
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

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={true} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {isAr ? "فاتورة رقم" : "Invoice #"}{selectedInvoice.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "المريض:" : "Patient:"}</span>
                  <span className="font-semibold">{selectedInvoice.patientName}</span>
                </div>
                {selectedInvoice.patientPhone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "الهاتف:" : "Phone:"}</span>
                    <span>{selectedInvoice.patientPhone}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "الوصف:" : "Description:"}</span>
                  <span className="text-end max-w-xs">{selectedInvoice.description}</span>
                </div>
                {selectedInvoice.notes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isAr ? "ملاحظات:" : "Notes:"}</span>
                    <span className="text-end max-w-xs">{selectedInvoice.notes}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "أُنشئ بواسطة:" : "Created by:"}</span>
                  <span>{selectedInvoice.createdByName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "الحالة:" : "Status:"}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[selectedInvoice.status]}`}>
                    {statusLabel[selectedInvoice.status]?.[isAr ? "ar" : "en"]}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? "الإجمالي" : "Total"}</p>
                  <p className="text-xl font-bold">{selectedInvoice.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                </div>
                <div className="rounded-lg border p-3 text-center border-green-200 bg-green-50 dark:bg-green-950/20">
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? "المدفوع" : "Paid"}</p>
                  <p className="text-xl font-bold text-green-600">{selectedInvoice.paidAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                </div>
                <div className={`rounded-lg border p-3 text-center ${selectedInvoice.remainingAmount > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "border-green-200 bg-green-50 dark:bg-green-950/20"}`}>
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? "المتبقي" : "Remaining"}</p>
                  <p className={`text-xl font-bold ${selectedInvoice.remainingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                    {selectedInvoice.remainingAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {isAr ? "سجل الدفعات" : "Payment History"}
                </h3>
                {selectedInvoice.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    {isAr ? "لا توجد دفعات بعد" : "No payments yet"}
                  </p>
                ) : (
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
                              {p.notes ? ` · ${p.notes}` : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(p.paymentDate), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />
            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button variant="outline" size="sm" onClick={() => printInvoice(selectedInvoice)} className="gap-2">
                <Printer className="h-4 w-4" />
                {isAr ? "طباعة" : "Print"}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                  {isAr ? "إغلاق" : "Close"}
                </Button>
                {selectedInvoice.status !== "paid" && selectedInvoice.status !== "cancelled" && (
                  <Button size="sm" onClick={() => setShowPaymentDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isAr ? "تسجيل دفعة" : "Add Payment"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? "إنشاء فاتورة جديدة" : "New Invoice"}</DialogTitle>
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
                placeholder={isAr ? "مثال: تركيب تاج ضرس العقل..." : "e.g. Crown installation..."}
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "المبلغ الإجمالي (د.ج)" : "Total Amount (DZD)"}</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={createForm.totalAmount}
                onChange={(e) => setCreateForm((f) => ({ ...f, totalAmount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{isAr ? "تاريخ الاستحقاق (اختياري)" : "Due Date (optional)"}</Label>
              <Input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
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
              disabled={!createForm.patientId || !createForm.description || !createForm.totalAmount || createMutation.isPending}
            >
              {createMutation.isPending ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "إنشاء الفاتورة" : "Create Invoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "تسجيل دفعة" : "Record Payment"}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "المتبقي:" : "Remaining:"}</span>
                  <span className="font-bold text-red-600">
                    {selectedInvoice.remainingAmount.toLocaleString()} {isAr ? "د.ج" : "DZD"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "المبلغ المدفوع (د.ج)" : "Amount Paid (DZD)"}</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedInvoice.remainingAmount}
                  placeholder="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setPaymentForm((f) => ({ ...f, amount: String(selectedInvoice.remainingAmount) }))}
                >
                  {isAr ? "دفع المبلغ كاملاً" : "Pay full amount"}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "طريقة الدفع" : "Payment Method"}</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{isAr ? "نقد" : "Cash"}</SelectItem>
                    <SelectItem value="card">{isAr ? "بطاقة" : "Card"}</SelectItem>
                    <SelectItem value="insurance">{isAr ? "تأمين" : "Insurance"}</SelectItem>
                    <SelectItem value="other">{isAr ? "أخرى" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() =>
                paymentMutation.mutate({
                  invoiceId: selectedInvoice!.id,
                  amount: Number(paymentForm.amount),
                  method: paymentForm.method,
                  notes: paymentForm.notes,
                })
              }
              disabled={!paymentForm.amount || Number(paymentForm.amount) <= 0 || paymentMutation.isPending}
            >
              {paymentMutation.isPending ? (isAr ? "جاري التسجيل..." : "Saving...") : (isAr ? "تسجيل الدفعة" : "Record Payment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
