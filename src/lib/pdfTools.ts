import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import jsPDF from "jspdf";
import mammoth from "mammoth";

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function mergePdfs(files: File[]): Promise<Blob> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function splitPdf(
  file: File,
  range: { from: number; to: number }
): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf);
  const total = src.getPageCount();
  const from = Math.max(1, Math.min(range.from, total));
  const to = Math.max(from, Math.min(range.to, total));
  const out = await PDFDocument.create();
  const indices: number[] = [];
  for (let i = from - 1; i <= to - 1; i++) indices.push(i);
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/**
 * Best-effort browser compression: re-renders each page to a JPEG bitmap and
 * rebuilds the PDF. Trades vector fidelity for size.
 */
export async function compressPdf(
  file: File,
  quality: number = 0.6
): Promise<Blob> {
  const buf = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const out = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const jpegBlob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej()), "image/jpeg", quality)
    );
    const img = await out.embedJpg(await jpegBlob.arrayBuffer());
    const pageOut = out.addPage([viewport.width, viewport.height]);
    pageOut.drawImage(img, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function pdfToJpgs(file: File): Promise<{ blob: Blob; name: string }[]> {
  const buf = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const base = file.name.replace(/\.pdf$/i, "");
  const out: { blob: Blob; name: string }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej()), "image/jpeg", 0.92)
    );
    out.push({ blob, name: `${base}-page-${i}.jpg` });
  }
  return out;
}

export async function jpgsToPdf(files: File[]): Promise<Blob> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const ext = file.name.split(".").pop()?.toLowerCase();
    let img;
    if (ext === "png" || file.type === "image/png") {
      img = await out.embedPng(buf);
    } else if (ext === "jpg" || ext === "jpeg" || file.type === "image/jpeg") {
      img = await out.embedJpg(buf);
    } else {
      // Re-encode webp/others to PNG via canvas
      const url = URL.createObjectURL(file);
      const im = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = im.naturalWidth;
      canvas.height = im.naturalHeight;
      canvas.getContext("2d")!.drawImage(im, 0, 0);
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej()), "image/png")
      );
      img = await out.embedPng(await blob.arrayBuffer());
      URL.revokeObjectURL(url);
    }
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function wordToPdf(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer: buf });
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const lineHeight = 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text || " ", maxWidth);
  let y = margin;
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }
  return doc.output("blob");
}

export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270
): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf);
  src.getPages().forEach((p) => {
    const current = p.getRotation().angle;
    p.setRotation(degrees((current + angle) % 360));
  });
  const bytes = await src.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function pdfToText(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return new Blob([text], { type: "text/plain" });
}

export async function pdfPageCount(file: File): Promise<number> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf);
  return src.getPageCount();
}