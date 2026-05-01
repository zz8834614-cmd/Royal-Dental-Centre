import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload, Printer, Plus, Trash2, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Square, Circle as CircleIcon,
  Minus, MousePointer, Type, ChevronUp, ChevronDown, Palette, X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const FONTS = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Cairo', sans-serif", label: "Cairo (AR)" },
  { value: "'Amiri', serif", label: "Amiri (AR)" },
];

type Align = "left" | "center" | "right";

interface TextElement {
  id: string;
  kind: "text";
  x: number; y: number; w: number; h: number;
  content: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean; italic: boolean; underline: boolean;
  color: string;
  align: Align;
  bgColor: string;
}

interface ShapeElement {
  id: string;
  kind: "rect" | "circle" | "hline";
  x: number; y: number; w: number; h: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

type CanvasElement = TextElement | ShapeElement;
type Tool = "select" | "text" | "rect" | "circle" | "hline";

function uid() {
  return Math.random().toString(36).slice(2);
}

interface Props {
  patientName?: string;
  doctorName?: string;
  initialMedications?: { name: string; dosage: string; frequency: string; duration: string }[];
  onClose?: () => void;
}

export function PdfPrescriptionEditor({
  patientName = "",
  doctorName = "",
  initialMedications = [],
  onClose,
}: Props) {
  const { language } = useI18n();
  const isAr = language === "ar";

  const [pdfImage, setPdfImage] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState({ w: 794, h: 1123 });
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{ id: string; ox: number; oy: number } | null>(null);

  // Text style state (for selected element or new text)
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(14);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("transparent");
  const [align, setAlign] = useState<Align>("left");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed initial elements from props
  useEffect(() => {
    const initial: TextElement[] = [];
    if (patientName) initial.push({
      id: uid(), kind: "text", x: 100, y: 80, w: 300, h: 30,
      content: patientName, fontFamily: "Arial, sans-serif",
      fontSize: 14, bold: false, italic: false, underline: false,
      color: "#000000", align: "left", bgColor: "transparent",
    });
    if (doctorName) initial.push({
      id: uid(), kind: "text", x: 100, y: 120, w: 300, h: 30,
      content: doctorName, fontFamily: "Arial, sans-serif",
      fontSize: 14, bold: false, italic: false, underline: false,
      color: "#000000", align: "left", bgColor: "transparent",
    });
    if (initialMedications.length > 0) {
      const medText = initialMedications.map(
        (m) => `${m.name}  ${m.dosage}  ${m.frequency}  ${m.duration}`
      ).join("\n");
      initial.push({
        id: uid(), kind: "text", x: 60, y: 200, w: 400, h: 200,
        content: medText, fontFamily: "Arial, sans-serif",
        fontSize: 13, bold: false, italic: false, underline: false,
        color: "#000000", align: "left", bgColor: "transparent",
      });
    }
    setElements(initial);
  }, []);

  // Sync toolbar to selected element
  useEffect(() => {
    if (!selected) return;
    const el = elements.find((e) => e.id === selected);
    if (!el) return;
    if (el.kind === "text") {
      setFontFamily(el.fontFamily);
      setFontSize(el.fontSize);
      setBold(el.bold);
      setItalic(el.italic);
      setUnderline(el.underline);
      setTextColor(el.color);
      setBgColor(el.bgColor);
      setAlign(el.align);
    } else {
      setStrokeColor(el.strokeColor);
      setFillColor(el.fillColor);
      setStrokeWidth(el.strokeWidth);
    }
  }, [selected, elements]);

  // Update selected text element style
  function updateSelected(patch: Partial<TextElement & ShapeElement>) {
    if (!selected) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selected ? { ...el, ...patch } as CanvasElement : el))
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    setPdfImage(canvas.toDataURL("image/png"));
    setPdfSize({ w: viewport.width, h: viewport.height });
    e.target.value = "";
  }

  function getCanvasPoint(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = pdfSize.w / rect.width;
    const scaleY = pdfSize.h / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (editingId) return;
    const pt = getCanvasPoint(e);

    // Click on element?
    const hit = [...elements].reverse().find((el) => {
      return pt.x >= el.x && pt.x <= el.x + el.w && pt.y >= el.y && pt.y <= el.y + el.h;
    });

    if (tool === "select") {
      if (hit) {
        setSelected(hit.id);
        setDragState({ id: hit.id, ox: pt.x - hit.x, oy: pt.y - hit.y });
      } else {
        setSelected(null);
      }
      return;
    }

    if (tool === "text") {
      if (hit && hit.kind === "text") {
        setSelected(hit.id);
        return;
      }
      const newEl: TextElement = {
        id: uid(), kind: "text",
        x: pt.x, y: pt.y, w: 200, h: 36,
        content: isAr ? "نص جديد" : "New text",
        fontFamily, fontSize, bold, italic, underline,
        color: textColor, align, bgColor,
      };
      setElements((p) => [...p, newEl]);
      setSelected(newEl.id);
      setTool("select");
      return;
    }

    // Shape tools
    setIsDrawing(true);
    setDrawStart(pt);
    const newEl: ShapeElement = {
      id: uid(), kind: tool as ShapeElement["kind"],
      x: pt.x, y: pt.y, w: 0, h: tool === "hline" ? 2 : 0,
      strokeColor, fillColor, strokeWidth,
    };
    setElements((p) => [...p, newEl]);
    setSelected(newEl.id);
  }

  function handleCanvasMouseMove(e: React.MouseEvent) {
    const pt = getCanvasPoint(e);
    if (dragState && !isDrawing) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === dragState.id
            ? { ...el, x: pt.x - dragState.ox, y: pt.y - dragState.oy }
            : el
        )
      );
      return;
    }
    if (isDrawing && selected) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selected) return el;
          const w = Math.abs(pt.x - drawStart.x);
          const h = el.kind === "hline" ? el.strokeWidth : Math.abs(pt.y - drawStart.y);
          return {
            ...el,
            x: Math.min(pt.x, drawStart.x),
            y: Math.min(pt.y, drawStart.y),
            w, h,
          };
        })
      );
    }
  }

  function handleCanvasMouseUp() {
    setDragState(null);
    if (isDrawing) {
      setIsDrawing(false);
      setTool("select");
    }
  }

  function handleTextDblClick(id: string) {
    setEditingId(id);
    setSelected(id);
  }

  function handleTextBlur(id: string, value: string) {
    setElements((p) =>
      p.map((el) => (el.id === id ? { ...el, content: value } as CanvasElement : el))
    );
    setEditingId(null);
  }

  function deleteSelected() {
    if (!selected) return;
    setElements((p) => p.filter((el) => el.id !== selected));
    setSelected(null);
  }

  function bringForward() {
    if (!selected) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selected);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function sendBackward() {
    if (!selected) return;
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === selected);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  }

  function print() {
    const scaleX = 794 / pdfSize.w;
    const scaleY = 1123 / pdfSize.h;

    const elementsHtml = elements.map((el) => {
      const left = el.x * scaleX;
      const top = el.y * scaleY;
      const width = el.w * scaleX;
      const height = el.h * scaleY;

      if (el.kind === "text") {
        const fs = el.fontSize * Math.min(scaleX, scaleY);
        return `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;min-height:${height}px;
          font-family:${el.fontFamily};font-size:${fs}px;
          font-weight:${el.bold ? "bold" : "normal"};
          font-style:${el.italic ? "italic" : "normal"};
          text-decoration:${el.underline ? "underline" : "none"};
          color:${el.color};background:${el.bgColor};
          text-align:${el.align};
          white-space:pre-wrap;word-break:break-word;overflow:visible;">${el.content}</div>`;
      }

      if (el.kind === "rect") {
        return `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;
          border:${el.strokeWidth}px solid ${el.strokeColor};background:${el.fillColor};box-sizing:border-box;"></div>`;
      }
      if (el.kind === "circle") {
        return `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${height}px;
          border:${el.strokeWidth}px solid ${el.strokeColor};background:${el.fillColor};border-radius:50%;box-sizing:border-box;"></div>`;
      }
      if (el.kind === "hline") {
        return `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${el.strokeWidth}px;background:${el.strokeColor};"></div>`;
      }
      return "";
    }).join("");

    const bgStyle = pdfImage
      ? `background-image:url('${pdfImage}');background-size:100% 100%;background-repeat:no-repeat;`
      : "background:#fff;";

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html>
      <head><meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @page { margin: 0; size: A4; }
        body { margin: 0; padding: 0; }
        .page { position: relative; width: 794px; height: 1123px; ${bgStyle} overflow: hidden; }
      </style></head>
      <body>
        <div class="page">${elementsHtml}</div>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    win.document.close();
  }

  const selectedEl = elements.find((e) => e.id === selected);
  const isTextSelected = selectedEl?.kind === "text";
  const isShapeSelected = selectedEl && selectedEl.kind !== "text";

  return (
    <div className="flex flex-col gap-0 h-full" style={{ minHeight: 600 }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/40 rounded-t-lg">
        {/* Tool group */}
        <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background">
          {([
            { t: "select" as Tool, icon: MousePointer, tip: isAr ? "تحديد" : "Select" },
            { t: "text" as Tool, icon: Type, tip: isAr ? "نص" : "Text" },
            { t: "rect" as Tool, icon: Square, tip: isAr ? "مستطيل" : "Rectangle" },
            { t: "circle" as Tool, icon: CircleIcon, tip: isAr ? "دائرة" : "Circle" },
            { t: "hline" as Tool, icon: Minus, tip: isAr ? "خط أفقي" : "Line" },
          ] as { t: Tool; icon: React.ElementType; tip: string }[]).map(({ t, icon: Icon, tip }) => (
            <Tooltip key={t}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTool(t)}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded text-xs transition-colors",
                    tool === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tip}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-px h-6 bg-border mx-0.5" />

        {/* Font controls — shown for text tool or selected text */}
        {(tool === "text" || isTextSelected) && (
          <>
            <Select value={fontFamily} onValueChange={(v) => { setFontFamily(v); updateSelected({ fontFamily: v }); }}>
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md overflow-hidden bg-background">
              <button
                className="h-7 w-6 flex items-center justify-center hover:bg-muted text-xs"
                onClick={() => { const v = Math.max(6, fontSize - 1); setFontSize(v); updateSelected({ fontSize: v }); }}
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              <input
                type="number"
                className="h-7 w-10 text-center text-xs border-0 bg-background focus:outline-none"
                value={fontSize}
                min={6} max={96}
                onChange={(e) => { const v = Number(e.target.value); setFontSize(v); updateSelected({ fontSize: v }); }}
              />
              <button
                className="h-7 w-6 flex items-center justify-center hover:bg-muted text-xs"
                onClick={() => { const v = Math.min(96, fontSize + 1); setFontSize(v); updateSelected({ fontSize: v }); }}
              >
                <ChevronUp className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setBold(!bold); updateSelected({ bold: !bold }); }}
                    className={cn("h-7 w-7 flex items-center justify-center rounded text-xs font-bold", bold ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  ><Bold className="h-3.5 w-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setItalic(!italic); updateSelected({ italic: !italic }); }}
                    className={cn("h-7 w-7 flex items-center justify-center rounded text-xs italic", italic ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  ><Italic className="h-3.5 w-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => { setUnderline(!underline); updateSelected({ underline: !underline }); }}
                    className={cn("h-7 w-7 flex items-center justify-center rounded text-xs underline", underline ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  ><Underline className="h-3.5 w-3.5" /></button>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background">
              {(["left", "center", "right"] as Align[]).map((a) => {
                const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                return (
                  <button
                    key={a}
                    onClick={() => { setAlign(a); updateSelected({ align: a }); }}
                    className={cn("h-7 w-7 flex items-center justify-center rounded", align === a ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  ><Icon className="h-3.5 w-3.5" /></button>
                );
              })}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <label className="h-7 w-7 flex items-center justify-center rounded border bg-background hover:bg-muted cursor-pointer relative">
                  <Palette className="h-3.5 w-3.5" />
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={textColor}
                    onChange={(e) => { setTextColor(e.target.value); updateSelected({ color: e.target.value }); }}
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>{isAr ? "لون النص" : "Text color"}</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Shape controls */}
        {isShapeSelected && (
          <>
            <label className="flex items-center gap-1 text-xs border rounded-md px-2 h-7 bg-background cursor-pointer">
              <span className="text-muted-foreground">{isAr ? "حد:" : "Stroke:"}</span>
              <input
                type="color"
                className="h-4 w-6 rounded cursor-pointer border-0"
                value={(selectedEl as ShapeElement).strokeColor}
                onChange={(e) => { setStrokeColor(e.target.value); updateSelected({ strokeColor: e.target.value }); }}
              />
            </label>
            <label className="flex items-center gap-1 text-xs border rounded-md px-2 h-7 bg-background cursor-pointer">
              <span className="text-muted-foreground">{isAr ? "تعبئة:" : "Fill:"}</span>
              <input
                type="color"
                className="h-4 w-6 rounded cursor-pointer border-0"
                value={(selectedEl as ShapeElement).fillColor === "transparent" ? "#ffffff" : (selectedEl as ShapeElement).fillColor}
                onChange={(e) => { setFillColor(e.target.value); updateSelected({ fillColor: e.target.value }); }}
              />
            </label>
            <div className="flex items-center border rounded-md overflow-hidden bg-background">
              <button className="h-7 w-6 flex items-center justify-center hover:bg-muted" onClick={() => { const v = Math.max(1, strokeWidth - 1); setStrokeWidth(v); updateSelected({ strokeWidth: v }); }}>
                <ChevronDown className="h-3 w-3" />
              </button>
              <span className="h-7 w-6 flex items-center justify-center text-xs">{strokeWidth}</span>
              <button className="h-7 w-6 flex items-center justify-center hover:bg-muted" onClick={() => { const v = Math.min(20, strokeWidth + 1); setStrokeWidth(v); updateSelected({ strokeWidth: v }); }}>
                <ChevronUp className="h-3 w-3" />
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {selected && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={sendBackward} className="h-7 w-7 flex items-center justify-center rounded border bg-background hover:bg-muted">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isAr ? "إلى الخلف" : "Send back"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={bringForward} className="h-7 w-7 flex items-center justify-center rounded border bg-background hover:bg-muted">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isAr ? "إلى الأمام" : "Bring forward"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={deleteSelected} className="h-7 w-7 flex items-center justify-center rounded border bg-background hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isAr ? "حذف" : "Delete"}</TooltipContent>
              </Tooltip>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {isAr ? "رفع PDF" : "Upload PDF"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />

          <Button size="sm" className="h-7 gap-1 text-xs" onClick={print}>
            <Printer className="h-3.5 w-3.5" />
            {isAr ? "طباعة" : "Print"}
          </Button>

          {onClose && (
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-4 flex items-start justify-center">
        <div
          ref={canvasRef}
          className="relative shadow-xl"
          style={{
            width: "min(100%, 700px)",
            aspectRatio: `${pdfSize.w} / ${pdfSize.h}`,
            background: pdfImage ? `url(${pdfImage}) center/100% 100% no-repeat` : "#fff",
            cursor: tool === "select" ? "default" : "crosshair",
            userSelect: "none",
            touchAction: "none",
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {!pdfImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <Upload className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">{isAr ? "ارفع قالب PDF لبدء التحرير" : "Upload a PDF template to start editing"}</p>
              <p className="text-xs opacity-60 mt-1">{isAr ? "أو ابدأ بالكتابة مباشرة على الورقة البيضاء" : "Or start writing directly on the blank page"}</p>
            </div>
          )}

          {/* Render elements */}
          {elements.map((el) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            const scaleX = rect ? (rect.width / pdfSize.w) : 1;
            const scaleY = rect ? (rect.height / pdfSize.h) : 1;

            const style: React.CSSProperties = {
              position: "absolute",
              left: `${(el.x / pdfSize.w) * 100}%`,
              top: `${(el.y / pdfSize.h) * 100}%`,
              width: `${(el.w / pdfSize.w) * 100}%`,
              height: `${(el.h / pdfSize.h) * 100}%`,
              outline: selected === el.id ? "2px dashed #2563eb" : "none",
              outlineOffset: "2px",
              cursor: tool === "select" ? "move" : "crosshair",
              boxSizing: "border-box",
              zIndex: elements.indexOf(el) + 1,
            };

            if (el.kind === "text") {
              const fsScaled = `${(el.fontSize / pdfSize.h) * 100}vh`;
              if (editingId === el.id) {
                return (
                  <div
                    key={el.id}
                    style={{ ...style, outline: "2px solid #2563eb" }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <textarea
                      autoFocus
                      className="w-full h-full resize-none border-0 bg-transparent p-0 focus:outline-none"
                      style={{
                        fontFamily: el.fontFamily,
                        fontSize: `${el.fontSize * scaleX}px`,
                        fontWeight: el.bold ? "bold" : "normal",
                        fontStyle: el.italic ? "italic" : "normal",
                        textDecoration: el.underline ? "underline" : "none",
                        color: el.color,
                        textAlign: el.align,
                        background: el.bgColor,
                        lineHeight: 1.4,
                      }}
                      defaultValue={el.content}
                      onBlur={(e) => handleTextBlur(el.id, e.target.value)}
                    />
                  </div>
                );
              }
              return (
                <div
                  key={el.id}
                  style={{
                    ...style,
                    fontFamily: el.fontFamily,
                    fontSize: `${el.fontSize * scaleX}px`,
                    fontWeight: el.bold ? "bold" : "normal",
                    fontStyle: el.italic ? "italic" : "normal",
                    textDecoration: el.underline ? "underline" : "none",
                    color: el.color,
                    textAlign: el.align,
                    background: el.bgColor,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.4,
                    overflow: "visible",
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); setSelected(el.id); setDragState({ id: el.id, ox: getCanvasPoint(e).x - el.x, oy: getCanvasPoint(e).y - el.y }); }}
                  onDoubleClick={(e) => { e.stopPropagation(); handleTextDblClick(el.id); }}
                >
                  {el.content}
                </div>
              );
            }

            if (el.kind === "rect") {
              return (
                <div
                  key={el.id}
                  style={{
                    ...style,
                    border: `${el.strokeWidth}px solid ${el.strokeColor}`,
                    background: el.fillColor,
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); setSelected(el.id); setDragState({ id: el.id, ox: getCanvasPoint(e).x - el.x, oy: getCanvasPoint(e).y - el.y }); }}
                />
              );
            }
            if (el.kind === "circle") {
              return (
                <div
                  key={el.id}
                  style={{
                    ...style,
                    border: `${el.strokeWidth}px solid ${el.strokeColor}`,
                    background: el.fillColor,
                    borderRadius: "50%",
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); setSelected(el.id); setDragState({ id: el.id, ox: getCanvasPoint(e).x - el.x, oy: getCanvasPoint(e).y - el.y }); }}
                />
              );
            }
            if (el.kind === "hline") {
              return (
                <div
                  key={el.id}
                  style={{
                    ...style,
                    background: el.strokeColor,
                    height: `${el.strokeWidth}px`,
                  }}
                  onMouseDown={(e) => { e.stopPropagation(); setSelected(el.id); setDragState({ id: el.id, ox: getCanvasPoint(e).x - el.x, oy: getCanvasPoint(e).y - el.y }); }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-t bg-muted/20 text-xs text-muted-foreground rounded-b-lg">
        <span>
          {tool === "select" && (isAr ? "انقر لتحديد — اسحب للتحريك — انقر مزدوج للتحرير" : "Click to select · Drag to move · Double-click to edit")}
          {tool === "text" && (isAr ? "انقر على الصفحة لإضافة نص" : "Click anywhere on the page to add text")}
          {tool === "rect" && (isAr ? "اسحب لرسم مستطيل" : "Drag to draw a rectangle")}
          {tool === "circle" && (isAr ? "اسحب لرسم دائرة" : "Drag to draw a circle")}
          {tool === "hline" && (isAr ? "اسحب لرسم خط أفقي" : "Drag to draw a line")}
        </span>
        <span className="ms-auto">{elements.length} {isAr ? "عنصر" : "elements"}</span>
      </div>
    </div>
  );
}
