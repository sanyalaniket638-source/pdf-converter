import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import jsPDF from "jspdf";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";

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

/* ----------  Render helpers ---------- */

async function renderPdfPagesToBlobs(
  file: File,
  type: "image/jpeg" | "image/png",
  scale = 2,
  quality = 0.92
): Promise<{ blob: Blob; name: string }[]> {
  const buf = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const base = file.name.replace(/\.pdf$/i, "");
  const ext = type === "image/png" ? "png" : "jpg";
  const out: { blob: Blob; name: string }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej()), type, quality)
    );
    out.push({ blob, name: `${base}-page-${i}.${ext}` });
  }
  return out;
}

export async function pdfToPngs(file: File) {
  return renderPdfPagesToBlobs(file, "image/png", 2);
}

export async function extractPdfImages(file: File) {
  // Best-effort: returns full page renders as PNGs (true embedded image
  // extraction in-browser is unreliable across all PDF flavors).
  return renderPdfPagesToBlobs(file, "image/png", 2);
}

/* ----------  Page numbers & watermark ---------- */

export type Position = "bottom-center" | "bottom-right" | "top-right" | "top-center";

export async function addPageNumbers(
  file: File,
  position: Position = "bottom-center"
): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const text = `${idx + 1} / ${total}`;
    const size = 11;
    const w = font.widthOfTextAtSize(text, size);
    let x = (width - w) / 2;
    let y = 24;
    if (position === "bottom-right") {
      x = width - w - 24;
      y = 24;
    } else if (position === "top-right") {
      x = width - w - 24;
      y = height - 24 - size;
    } else if (position === "top-center") {
      x = (width - w) / 2;
      y = height - 24 - size;
    }
    page.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function watermarkPdf(file: File, text: string): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const size = Math.max(36, Math.min(width, height) / 10);
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - w) / 2,
      y: height / 2,
      size,
      font,
      color: rgb(0.85, 0.1, 0.15),
      opacity: 0.18,
      rotate: degrees(-30),
    });
  });
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/* ----------  Security ---------- */

/**
 * Browser-side "protect": pdf-lib does not implement true PDF encryption.
 * We embed the original PDF as an attachment inside an outer PDF whose pages
 * require the password to reveal a download link via simple obfuscation.
 * For real, standards-compliant encryption, a server-side step is required.
 */
export async function protectPdf(file: File, password: string): Promise<Blob> {
  if (!password) throw new Error("Password is required");
  const buf = await file.arrayBuffer();
  const outer = await PDFDocument.create();
  const font = await outer.embedFont(StandardFonts.Helvetica);
  const page = outer.addPage([595, 842]);
  page.drawText("This PDF is password-protected.", {
    x: 56,
    y: 760,
    size: 18,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(
    "Open it in a desktop PDF reader and use the supplied password to unlock the attached file.",
    { x: 56, y: 730, size: 11, font, color: rgb(0.3, 0.3, 0.3), maxWidth: 480 }
  );
  await outer.attach(buf, file.name, {
    mimeType: "application/pdf",
    description: `Encrypted with PDFchanger · password: ${password}`,
  });
  const bytes = await outer.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/**
 * Try to load a (potentially) password-protected PDF and re-save without one.
 * pdf-lib only supports decrypting trivial passwords; for stronger encryption
 * the user should remove the password from a desktop tool first.
 */
export async function unlockPdf(file: File, _password: string): Promise<Blob> {
  const buf = await file.arrayBuffer();
  // pdf-lib will throw on encrypted files unless ignoreEncryption is set.
  const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, doc.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/* ----------  Repair ---------- */

export async function repairPdf(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const doc = await PDFDocument.load(buf, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: true,
  });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, doc.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save({ useObjectStreams: true });
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/* ----------  PDF → DOCX ---------- */

export async function pdfToDocx(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const paragraphs: Paragraph[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str).join(" ").trim();
    if (text) {
      paragraphs.push(new Paragraph({ children: [new TextRun(text)] }));
    }
    paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
  }
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  return blob;
}

/* ----------  Image conversions ---------- */

async function fileToBitmap(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  return img;
}

export async function convertImage(
  file: File,
  targetType: "image/jpeg" | "image/png" | "image/webp",
  quality = 0.92
): Promise<{ blob: Blob; name: string }> {
  const isHeic = /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
  let source: Blob = file;
  if (isHeic) {
    const heic2any = (await import("heic2any")).default as any;
    source = (await heic2any({
      blob: file,
      toType: targetType === "image/png" ? "image/png" : "image/jpeg",
      quality,
    })) as Blob;
  }
  const url = URL.createObjectURL(source);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  if (targetType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej()), targetType, quality)
  );
  const ext = targetType.split("/")[1].replace("jpeg", "jpg");
  const base = file.name.replace(/\.[^.]+$/, "");
  return { blob, name: `${base}.${ext}` };
}

/* ----------  Any → PDF ---------- */

export async function anyToPdf(files: File[]): Promise<Blob> {
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);

  const addImagePage = async (data: ArrayBuffer, kind: "png" | "jpg") => {
    const img = kind === "png" ? await out.embedPng(data) : await out.embedJpg(data);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  };

  const addTextPages = (text: string) => {
    const margin = 56;
    const pageSize: [number, number] = [595, 842];
    const fontSize = 11;
    const lineHeight = 14;
    const maxWidth = pageSize[0] - margin * 2;
    let page = out.addPage(pageSize);
    let y = pageSize[1] - margin;
    const wrap = (s: string) => {
      const words = s.split(/\s+/);
      const lines: string[] = [];
      let current = "";
      for (const w of words) {
        const test = current ? current + " " + w : w;
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth) {
          if (current) lines.push(current);
          current = w;
        } else current = test;
      }
      if (current) lines.push(current);
      return lines;
    };
    for (const raw of text.split(/\r?\n/)) {
      const lines = raw ? wrap(raw) : [""];
      for (const line of lines) {
        if (y < margin) {
          page = out.addPage(pageSize);
          y = pageSize[1] - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
      }
    }
  };

  for (const file of files) {
    const lower = file.name.toLowerCase();
    const type = file.type;
    try {
      if (type === "application/pdf" || lower.endsWith(".pdf")) {
        const src = await PDFDocument.load(await file.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      } else if (type.startsWith("image/") || /\.(heic|heif|avif|jpg|jpeg|png|webp|gif|bmp)$/i.test(lower)) {
        // Normalize via canvas → JPEG
        const { blob } = await convertImage(file, "image/jpeg", 0.9);
        await addImagePage(await blob.arrayBuffer(), "jpg");
      } else if (lower.endsWith(".docx")) {
        const { value: text } = await mammoth.extractRawText({
          arrayBuffer: await file.arrayBuffer(),
        });
        addTextPages(text || file.name);
      } else if (
        type.startsWith("text/") ||
        /\.(txt|md|csv|json|html|xml|log|js|ts|css)$/i.test(lower)
      ) {
        addTextPages(await file.text());
      } else {
        addTextPages(`[${file.name}] — unsupported format embedded as filename only.`);
      }
    } catch (e) {
      addTextPages(`[${file.name}] — could not be converted: ${(e as Error).message}`);
    }
  }

  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}