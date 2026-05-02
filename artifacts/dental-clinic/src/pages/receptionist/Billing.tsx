import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search, AlertCircle, CheckCircle, Clock, CreditCard,
  Banknote, ChevronRight, Receipt, Printer,
} from "lucide-react";
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
  payments: Payment[];
}

const methodLabel: Record<string, { ar: string; en: string }> = {
  cash: { ar: "نقد", en: "Cash" },
  card: { ar: "بطاقة", en: "Card" },
  insurance: { ar: "تأمين", en: "Insurance" },
  other: { ar: "أخرى", en: "Other" },
};

export default function Billing() {
  const { language } = useI18n();
  const isAr = language === "ar";

  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", "active"],
    queryFn: () => apiFetch("/api/invoices"),
    refetchInterval: 10000,
  });

  const active = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "partial"
  );

  const filtered = active.filter((inv) => {
    if (!search) return true;
    return (
      inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalOutstanding = active.reduce((sum, inv) => sum + inv.remainingAmount, 0);

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
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? "المدفوعات وحسابات المرضى" : "Patient Billing"}</h1>
          <p className="text-muted-foreground text-sm">
            {isAr ? "عرض وطباعة فواتير المرضى" : "View and print patient invoices"}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "إجمالي المستحق" : "Total Outstanding"}</p>
                <p className="text-lg font-bold text-red-600">
                  {totalOutstanding.toLocaleString()} {isAr ? "د.ج" : "DZD"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "فواتير معلّقة" : "Pending Invoices"}</p>
                <p className="text-lg font-bold">{active.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "مرضى بحسابات مفتوحة" : "Patients with Balance"}</p>
                <p className="text-lg font-bold">{new Set(active.map((i) => i.patientId)).size}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={isAr ? "بحث عن مريض..." : "Search patient..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Invoice List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Clock className="h-5 w-5 animate-spin me-2" />
            {isAr ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mb-2 text-green-500 opacity-60" />
              <p className="font-medium">{isAr ? "لا توجد فواتير معلّقة" : "No pending invoices"}</p>
              <p className="text-xs">{isAr ? "جميع المرضى سدّدوا حساباتهم" : "All patients are settled"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => (
              <Card
                key={inv.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedInvoice(inv)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{inv.patientName}</p>
                        <Badge
                          variant="outline"
                          className={
                            inv.status === "partial"
                              ? "border-blue-400 text-blue-600"
                              : "border-yellow-400 text-yellow-600"
                          }
                        >
                          {inv.status === "partial"
                            ? (isAr ? "جزئي" : "Partial")
                            : (isAr ? "معلّق" : "Pending")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{inv.description}</p>
                      {inv.patientPhone && (
                        <p className="text-xs text-muted-foreground">{inv.patientPhone}</p>
                      )}
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs text-muted-foreground">{isAr ? "المتبقي" : "Remaining"}</p>
                      <p className="text-xl font-bold text-red-600">
                        {inv.remainingAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{isAr ? "د.ج" : "DZD"}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Detail Dialog — View Only */}
      {selectedInvoice && (
        <Dialog open={true} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {isAr ? "تفاصيل الحساب" : "Account Details"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Patient */}
              <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
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
                  <span className="text-muted-foreground">{isAr ? "الخدمة:" : "Service:"}</span>
                  <span className="text-end max-w-[200px]">{selectedInvoice.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "أُنشئ بواسطة:" : "Created by:"}</span>
                  <span>{selectedInvoice.createdByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? "التاريخ:" : "Date:"}</span>
                  <span>{format(new Date(selectedInvoice.createdAt), "dd/MM/yyyy")}</span>
                </div>
              </div>

              {/* Balance */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2">
                  <p className="text-xs text-muted-foreground">{isAr ? "الكلي" : "Total"}</p>
                  <p className="font-bold">{selectedInvoice.totalAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-2">
                  <p className="text-xs text-muted-foreground">{isAr ? "دفع" : "Paid"}</p>
                  <p className="font-bold text-green-600">{selectedInvoice.paidAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-2">
                  <p className="text-xs text-muted-foreground">{isAr ? "متبقي" : "Left"}</p>
                  <p className="font-bold text-red-600">{selectedInvoice.remainingAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment History */}
              {selectedInvoice.payments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {isAr ? "الدفعات السابقة" : "Previous Payments"}
                  </p>
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm border rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600 font-semibold">
                          +{Number(p.amount).toLocaleString()} {isAr ? "د.ج" : "DZD"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {methodLabel[p.method]?.[isAr ? "ar" : "en"]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(p.paymentDate), "dd/MM HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Outstanding Alert */}
              {selectedInvoice.remainingAmount > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {isAr
                      ? `على المريض ${selectedInvoice.patientName} دفع ${selectedInvoice.remainingAmount.toLocaleString()} د.ج`
                      : `${selectedInvoice.patientName} owes ${selectedInvoice.remainingAmount.toLocaleString()} DZD`}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                {isAr ? "إغلاق" : "Close"}
              </Button>
              <Button variant="outline" onClick={() => printInvoice(selectedInvoice)} className="gap-2">
                <Printer className="h-4 w-4" />
                {isAr ? "طباعة" : "Print"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
