import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { format, addDays } from "date-fns";

type DaySetting = {
  id: number;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotDuration: number;
};

type Block = {
  id: number;
  blockedDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  isFullDay: boolean;
};

const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ReceptionistSchedule() {
  const { language } = useI18n();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [settings, setSettings] = useState<DaySetting[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const [showBlock, setShowBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({
    blockedDate: format(new Date(), "yyyy-MM-dd"),
    isFullDay: true,
    startTime: "09:00",
    endTime: "12:00",
    reason: "",
  });
  const [addingBlock, setAddingBlock] = useState(false);

  const fetchAll = async () => {
    try {
      const [s, b] = await Promise.all([
        apiFetch("/api/schedule"),
        apiFetch("/api/schedule/blocks"),
      ]);
      setSettings(s as DaySetting[]);
      setBlocks(b as Block[]);
    } catch {
      toast({ title: isAr ? "فشل تحميل الجدول" : "Failed to load schedule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateDay = async (day: DaySetting, changes: Partial<DaySetting>) => {
    setSaving(day.dayOfWeek);
    try {
      const updated = await apiFetch(`/api/schedule/${day.dayOfWeek}`, {
        method: "PUT",
        body: JSON.stringify({ ...day, ...changes }),
      });
      setSettings(prev => prev.map(s => s.dayOfWeek === day.dayOfWeek ? (updated as DaySetting) : s));
      toast({ title: isAr ? "تم حفظ التغييرات" : "Changes saved" });
    } catch {
      toast({ title: isAr ? "فشل الحفظ" : "Save failed", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const addBlock = async () => {
    setAddingBlock(true);
    try {
      const body = blockForm.isFullDay
        ? { blockedDate: blockForm.blockedDate, isFullDay: true, reason: blockForm.reason || null }
        : { blockedDate: blockForm.blockedDate, isFullDay: false, startTime: blockForm.startTime, endTime: blockForm.endTime, reason: blockForm.reason || null };

      const created = await apiFetch("/api/schedule/blocks", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setBlocks(prev => [...prev, created as Block]);
      toast({ title: isAr ? "تم إضافة الإغلاق" : "Block added" });
      setShowBlock(false);
    } catch {
      toast({ title: isAr ? "فشل الإضافة" : "Failed to add", variant: "destructive" });
    } finally {
      setAddingBlock(false);
    }
  };

  const removeBlock = async (id: number) => {
    try {
      await apiFetch(`/api/schedule/blocks/${id}`, { method: "DELETE" });
      setBlocks(prev => prev.filter(b => b.id !== id));
      toast({ title: isAr ? "تم حذف الإغلاق" : "Block removed" });
    } catch {
      toast({ title: isAr ? "فشل الحذف" : "Delete failed", variant: "destructive" });
    }
  };

  const upcomingBlocks = blocks
    .filter(b => b.blockedDate >= format(new Date(), "yyyy-MM-dd"))
    .sort((a, b) => a.blockedDate.localeCompare(b.blockedDate));

  return (
    <DashboardLayout allowedRoles={["receptionist"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isAr ? "إدارة جدول الحجوزات" : "Booking Schedule"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr ? "تحكم في أوقات الحجز وأيام العمل" : "Control booking hours and working days"}
            </p>
          </div>
          <Button onClick={() => setShowBlock(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة إغلاق" : "Add Block"}
          </Button>
        </div>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {isAr ? "جدول أيام الأسبوع" : "Weekly Schedule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
            ) : (
              <div className="space-y-3">
                {settings.map(day => (
                  <div key={day.dayOfWeek} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-colors ${day.isOpen ? "bg-green-50/30 border-green-100 dark:bg-green-950/10 dark:border-green-900/30" : "bg-muted/30"}`}>
                    <div className="flex items-center justify-between sm:w-36 gap-2">
                      <span className={`font-medium text-sm ${day.isOpen ? "" : "text-muted-foreground"}`}>
                        {isAr ? DAY_NAMES_AR[day.dayOfWeek] : DAY_NAMES_EN[day.dayOfWeek]}
                      </span>
                      <Switch
                        checked={day.isOpen}
                        onCheckedChange={(checked) => updateDay(day, { isOpen: checked })}
                        disabled={saving === day.dayOfWeek}
                      />
                    </div>

                    {day.isOpen ? (
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            {isAr ? "من" : "From"}
                          </Label>
                          <Input
                            type="time"
                            className="h-7 w-28 text-xs"
                            value={day.openTime}
                            onChange={e => setSettings(prev => prev.map(s => s.dayOfWeek === day.dayOfWeek ? { ...s, openTime: e.target.value } : s))}
                            onBlur={() => updateDay(day, { openTime: day.openTime })}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            {isAr ? "إلى" : "To"}
                          </Label>
                          <Input
                            type="time"
                            className="h-7 w-28 text-xs"
                            value={day.closeTime}
                            onChange={e => setSettings(prev => prev.map(s => s.dayOfWeek === day.dayOfWeek ? { ...s, closeTime: e.target.value } : s))}
                            onBlur={() => updateDay(day, { closeTime: day.closeTime })}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            {isAr ? "مدة الموعد" : "Slot (min)"}
                          </Label>
                          <Input
                            type="number"
                            min={15}
                            max={120}
                            step={15}
                            className="h-7 w-20 text-xs"
                            value={day.slotDuration}
                            onChange={e => setSettings(prev => prev.map(s => s.dayOfWeek === day.dayOfWeek ? { ...s, slotDuration: parseInt(e.target.value) || 30 } : s))}
                            onBlur={() => updateDay(day, { slotDuration: day.slotDuration })}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{isAr ? "مغلق - لا يتيح الحجز" : "Closed – no bookings"}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Blocks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              {isAr ? "الإغلاقات القادمة" : "Upcoming Blocks"}
              {upcomingBlocks.length > 0 && (
                <Badge className="ms-1 bg-orange-500 text-white">{upcomingBlocks.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isAr ? "لا توجد إغلاقات مجدولة" : "No upcoming blocks scheduled"}
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingBlocks.map(block => (
                  <div key={block.id} className="flex items-center gap-3 p-3 rounded-lg border bg-orange-50/30 dark:bg-orange-950/10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{block.blockedDate}</span>
                        {block.isFullDay ? (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {isAr ? "يوم كامل" : "Full Day"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {block.startTime} – {block.endTime}
                          </Badge>
                        )}
                      </div>
                      {block.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{block.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeBlock(block.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={showBlock} onOpenChange={setShowBlock}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة إغلاق جديد" : "Add Schedule Block"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label>{isAr ? "التاريخ" : "Date"}</Label>
              <Input
                type="date"
                value={blockForm.blockedDate}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={e => setBlockForm(f => ({ ...f, blockedDate: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={blockForm.isFullDay}
                onCheckedChange={v => setBlockForm(f => ({ ...f, isFullDay: v }))}
              />
              <Label>{isAr ? "إغلاق اليوم كاملاً" : "Block entire day"}</Label>
            </div>

            {!blockForm.isFullDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{isAr ? "من الساعة" : "From"}</Label>
                  <Input type="time" value={blockForm.startTime} onChange={e => setBlockForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{isAr ? "حتى الساعة" : "Until"}</Label>
                  <Input type="time" value={blockForm.endTime} onChange={e => setBlockForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>{isAr ? "السبب (اختياري)" : "Reason (optional)"}</Label>
              <Input
                placeholder={isAr ? "مثال: إجازة، صيانة..." : "e.g. Holiday, maintenance..."}
                value={blockForm.reason}
                onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBlock(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={addBlock} disabled={addingBlock}>
              {addingBlock ? (isAr ? "جارٍ الإضافة..." : "Adding...") : (isAr ? "تأكيد الإغلاق" : "Confirm Block")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
