import { useState, useRef, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Printer, Plus, Trash2, Move, RotateCcw, Save } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface DraggableField {
  id: string;
  label: string;
  labelAr: string;
  x: number;
  y: number;
  value: string;
  fontSize: number;
  color: string;
}

interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PdfPrescriptionEditorProps {
  patientName?: string;
  patientId?: number;
  doctorName?: string;
  initialMedications?: { medicationName: string; dosage?: string; frequency?: string; duration?: string }[];
  onClose?: () => void;
}

export function PdfPrescriptionEditor({
  patientName = "",
  doctorName = "",
  initialMedications = [],
  onClose,
}: PdfPrescriptionEditorProps) {
  const { language } = useI18n();
  const isAr = language === "ar";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [medications, setMedications] = useState<MedicationEntry[]>(
    initialMedications.map(m => ({
      name: m.medicationName,
      dosage: m.dosage || "",
      frequency: m.frequency || "",
      duration: m.duration || "",
    }))
  );

  const [fields, setFields] = useState<DraggableField[]>([
    { id: "patient", label: "Patient Name", labelAr: "اسم المريض", x: 80, y: 120, value: patientName, fontSize: 14, color: "#1a1a1a" },
    { id: "doctor", label: "Doctor", labelAr: "الطبيب", x: 400, y: 120, value: `Dr. ${doctorName}`, fontSize: 14, color: "#1a1a1a" },
    { id: "date", label: "Date", labelAr: "التاريخ", x: 80, y: 155, value: format(new Date(), "dd/MM/yyyy"), fontSize: 13, color: "#555" },
    { id: "meds", label: "Medications", labelAr: "الأدوية", x: 80, y: 230, value: "", fontSize: 13, color: "#1a1a1a" },
  ]);

  const renderPdf = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    setCanvasSize({ width: viewport.width, height: viewport.height });
    await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport }).promise;
    setPdfDataUrl(canvas.toDataURL("image/png"));
    setPdfLoaded(true);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      renderPdf(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const field = fields.find(f => f.id === id)!;
    setDragging(id);
    setDragOffset({ x: e.clientX - rect.left - field.x, y: e.clientY - rect.top - field.y });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, canvasSize.width - 10));
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, canvasSize.height - 10));
    setFields(prev => prev.map(f => f.id === dragging ? { ...f, x, y } : f));
  }, [dragging, dragOffset, canvasSize]);

  const handleMouseUp = () => setDragging(null);

  const medsText = medications
    .map((m, i) => `${i + 1}. ${m.name}${m.dosage ? ` — ${m.dosage}` : ""}${m.frequency ? ` × ${m.frequency}` : ""}${m.duration ? ` (${m.duration})` : ""}`)
    .join("\n");

  useEffect(() => {
    setFields(prev => prev.map(f => f.id === "meds" ? { ...f, value: medsText } : f));
  }, [medsText]);

  const handlePrint = () => {
    if (!pdfLoaded) return;
    const medsHtml = medications.map((m, i) =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i+1}. ${m.name}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${m.dosage}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${m.frequency}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${m.duration}</td></tr>`
    ).join("");
    const pdfField = (id: string) => fields.find(f => f.id === id)?.value || "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8">
  <title>${isAr ? "وصفة طبية" : "Prescription"}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Naskh Arabic', Arial, sans-serif; }
    .page { position: relative; width: ${canvasSize.width}px; min-height: ${canvasSize.height}px; }
    .pdf-bg { position: absolute; top: 0; left: 0; width: 100%; height: auto; z-index: 0; }
    .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
    ${fields.map(f => `#f-${f.id} { position: absolute; left: ${f.x}px; top: ${f.y}px; font-size: ${f.fontSize}px; color: ${f.color}; white-space: pre-line; font-weight: ${f.id === "patient" || f.id === "doctor" ? "bold" : "normal"}; }`).join("\n")}
    .meds-table { position: absolute; left: ${fields.find(f=>f.id==="meds")?.x||80}px; top: ${fields.find(f=>f.id==="meds")?.y||230}px; font-size: 13px; border-collapse: collapse; z-index: 2; }
    .meds-table th { background: #b8860b; color: white; padding: 6px 8px; font-size: 12px; }
    @media print { html, body { width: ${canvasSize.width}px; } .page { page-break-after: always; } }
  </style>
</head>
<body>
  <div class="page">
    <img class="pdf-bg" src="${pdfDataUrl}" />
    <div class="overlay">
      <div id="f-patient">${pdfField("patient")}</div>
      <div id="f-doctor">${pdfField("doctor")}</div>
      <div id="f-date">${pdfField("date")}</div>
      ${medications.length > 0 ? `
      <table class="meds-table">
        <thead><tr>
          <th>${isAr ? "الدواء" : "Medication"}</th>
          <th>${isAr ? "الجرعة" : "Dosage"}</th>
          <th>${isAr ? "التكرار" : "Frequency"}</th>
          <th>${isAr ? "المدة" : "Duration"}</th>
        </tr></thead>
        <tbody>${medsHtml}</tbody>
      </table>` : ""}
    </div>
  </div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 2000); }<\/script>
</body></html>`);
    win.document.close();
  };

  const addMedication = () => {
    setMedications(prev => [...prev, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeMedication = (i: number) => {
    setMedications(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateMedication = (i: number, key: keyof MedicationEntry, val: string) => {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  };

  const updateField = (id: string, value: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Upload className="h-4 w-4" />
          {isAr ? "رفع قالب الوصفة (PDF)" : "Upload Prescription Template (PDF)"}
        </Button>
        <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
        {pdfLoaded && (
          <>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              {isAr ? "طباعة / حفظ الوصفة" : "Print / Save Prescription"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setPdfLoaded(false); setPdfDataUrl(""); }} className="gap-1 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              {isAr ? "تغيير الملف" : "Change File"}
            </Button>
          </>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="ms-auto">
            {isAr ? "إغلاق" : "Close"}
          </Button>
        )}
      </div>

      {!pdfLoaded && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{isAr ? "ارفع قالب الوصفة الطبية" : "Upload Prescription Template"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {isAr ? "اضغط هنا لاختيار ملف PDF — ستظهر نافذة التحرير لإضافة بيانات المريض والأدوية" : "Click here to select a PDF file — the editor will appear to fill in patient data and medications"}
              </p>
            </div>
            <Badge variant="outline">PDF</Badge>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {pdfLoaded && (
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Move className="h-3.5 w-3.5" />
              <span>{isAr ? "اسحب حقول النص لوضعها في المكان الصحيح على الوصفة" : "Drag the text fields to position them correctly on the prescription"}</span>
            </div>
            <div
              ref={containerRef}
              className="relative border rounded-xl overflow-hidden select-none bg-white shadow-md"
              style={{ width: canvasSize.width, maxWidth: "100%", height: canvasSize.height }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={pdfDataUrl}
                alt="PDF template"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              {fields.map(field => (
                field.id === "meds" ? (
                  <div
                    key={field.id}
                    className="absolute cursor-move z-20"
                    style={{ left: field.x, top: field.y }}
                    onMouseDown={(e) => handleMouseDown(e, field.id)}
                  >
                    <div className={`border-2 border-dashed border-primary/60 rounded px-2 py-1 bg-white/90 shadow-sm`}>
                      <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">
                        {isAr ? "الأدوية" : "Medications"}
                      </p>
                      {medications.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {isAr ? "لا توجد أدوية" : "No medications added"}
                        </p>
                      ) : (
                        <div className="space-y-0.5">
                          {medications.map((m, i) => (
                            <p key={i} style={{ fontSize: field.fontSize, color: field.color }} className="leading-snug">
                              {i+1}. {m.name}{m.dosage ? ` — ${m.dosage}` : ""}{m.frequency ? ` × ${m.frequency}` : ""}{m.duration ? ` (${m.duration})` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    key={field.id}
                    className="absolute cursor-move z-20 group"
                    style={{ left: field.x, top: field.y }}
                    onMouseDown={(e) => handleMouseDown(e, field.id)}
                  >
                    <div className="border border-dashed border-primary/50 rounded px-2 py-0.5 bg-white/90 shadow-sm">
                      <span className="text-[9px] text-primary/70 block leading-none mb-0.5">
                        {isAr ? field.labelAr : field.label}
                      </span>
                      <span style={{ fontSize: field.fontSize, color: field.color, fontWeight: field.id === "patient" || field.id === "doctor" ? "bold" : "normal" }}>
                        {field.value || (isAr ? `[${field.labelAr}]` : `[${field.label}]`)}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{isAr ? "بيانات المريض" : "Patient Info"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "اسم المريض" : "Patient Name"}</Label>
                  <Input
                    value={fields.find(f => f.id === "patient")?.value || ""}
                    onChange={e => updateField("patient", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الطبيب" : "Doctor"}</Label>
                  <Input
                    value={fields.find(f => f.id === "doctor")?.value || ""}
                    onChange={e => updateField("doctor", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "التاريخ" : "Date"}</Label>
                  <Input
                    value={fields.find(f => f.id === "date")?.value || ""}
                    onChange={e => updateField("date", e.target.value)}
                    className="h-8 text-sm"
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{isAr ? "الأدوية" : "Medications"}</CardTitle>
                <Button size="sm" variant="outline" onClick={addMedication} className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" />
                  {isAr ? "إضافة" : "Add"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {medications.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {isAr ? "لا توجد أدوية — اضغط إضافة" : "No medications — click Add"}
                  </p>
                )}
                {medications.map((med, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 end-1 h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeMedication(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Input
                      placeholder={isAr ? "اسم الدواء *" : "Medication name *"}
                      value={med.name}
                      onChange={e => updateMedication(i, "name", e.target.value)}
                      className="h-7 text-xs pr-8"
                    />
                    <div className="grid grid-cols-3 gap-1.5">
                      <Input placeholder={isAr ? "الجرعة" : "Dosage"} value={med.dosage} onChange={e => updateMedication(i, "dosage", e.target.value)} className="h-7 text-xs" />
                      <Input placeholder={isAr ? "التكرار" : "Freq."} value={med.frequency} onChange={e => updateMedication(i, "frequency", e.target.value)} className="h-7 text-xs" />
                      <Input placeholder={isAr ? "المدة" : "Duration"} value={med.duration} onChange={e => updateMedication(i, "duration", e.target.value)} className="h-7 text-xs" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button onClick={handlePrint} className="w-full gap-2">
              <Printer className="h-4 w-4" />
              {isAr ? "طباعة / حفظ الوصفة" : "Print / Save Prescription"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
