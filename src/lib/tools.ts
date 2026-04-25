import {
  Combine,
  Scissors,
  Minimize2,
  FileImage,
  ImageDown,
  FileText,
  RotateCw,
  FileType2,
  Hash,
  Droplets,
  Lock,
  Unlock,
  Wrench,
  Images,
  ScanText,
  Languages,
  Sparkles,
  ImageIcon,
  Replace,
  FileCog,
  FileSpreadsheet,
  Presentation,
  type LucideIcon,
} from "lucide-react";

export type ToolId =
  | "merge-pdf"
  | "split-pdf"
  | "compress-pdf"
  | "pdf-to-jpg"
  | "jpg-to-pdf"
  | "word-to-pdf"
  | "rotate-pdf"
  | "pdf-to-text"
  | "pdf-to-docx"
  | "pdf-to-png"
  | "page-numbers"
  | "watermark-pdf"
  | "protect-pdf"
  | "unlock-pdf"
  | "repair-pdf"
  | "extract-images"
  | "ocr-pdf"
  | "heic-to-jpg"
  | "avif-to-jpg"
  | "image-convert"
  | "any-to-pdf"
  | "ai-summarize"
  | "ai-translate";

export type ToolCategory =
  | "Organize"
  | "Optimize"
  | "Convert to PDF"
  | "Convert from PDF"
  | "Edit"
  | "Security"
  | "Images"
  | "AI";

export interface Tool {
  id: ToolId;
  title: string;
  short: string;
  description: string;
  icon: LucideIcon;
  color: string; // tailwind text color class
  bg: string; // tailwind bg color class
  accept: string;
  multiple: boolean;
  category: ToolCategory;
  badge?: "AI" | "New";
}

export const TOOLS: Tool[] = [
  {
    id: "merge-pdf",
    title: "Merge PDF",
    short: "Combine PDFs",
    description:
      "Combine multiple PDFs into a single document in the order you choose.",
    icon: Combine,
    color: "text-rose-600",
    bg: "bg-rose-50",
    accept: "application/pdf",
    multiple: true,
    category: "Organize",
  },
  {
    id: "split-pdf",
    title: "Split PDF",
    short: "Extract pages",
    description: "Extract one page or a range of pages from a PDF.",
    icon: Scissors,
    color: "text-amber-600",
    bg: "bg-amber-50",
    accept: "application/pdf",
    multiple: false,
    category: "Organize",
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    short: "Reduce file size",
    description: "Reduce PDF file size while keeping the best quality possible.",
    icon: Minimize2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    accept: "application/pdf",
    multiple: false,
    category: "Optimize",
  },
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    short: "Convert pages",
    description: "Convert each page of a PDF into a high-quality JPG image.",
    icon: ImageDown,
    color: "text-sky-600",
    bg: "bg-sky-50",
    accept: "application/pdf",
    multiple: false,
    category: "Convert from PDF",
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    short: "Images → PDF",
    description: "Convert JPG, PNG or WebP images into a single PDF document.",
    icon: FileImage,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    accept: "image/jpeg,image/png,image/webp",
    multiple: true,
    category: "Convert to PDF",
  },
  {
    id: "word-to-pdf",
    title: "Word to PDF",
    short: "DOCX → PDF",
    description: "Convert a DOCX document into a clean PDF, right in your browser.",
    icon: FileType2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    accept:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: false,
    category: "Convert to PDF",
  },
  {
    id: "rotate-pdf",
    title: "Rotate PDF",
    short: "Turn pages",
    description: "Rotate all pages of a PDF by 90, 180 or 270 degrees.",
    icon: RotateCw,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    accept: "application/pdf",
    multiple: false,
    category: "Edit",
  },
  {
    id: "pdf-to-text",
    title: "PDF to Text",
    short: "Extract text",
    description: "Extract all readable text from a PDF into a .txt file.",
    icon: FileText,
    color: "text-teal-600",
    bg: "bg-teal-50",
    accept: "application/pdf",
    multiple: false,
    category: "Convert from PDF",
  },
  {
    id: "pdf-to-docx",
    title: "PDF to Word",
    short: "PDF → DOCX",
    description: "Extract the text from a PDF and save it as an editable DOCX file.",
    icon: FileCog,
    color: "text-blue-700",
    bg: "bg-blue-50",
    accept: "application/pdf",
    multiple: false,
    category: "Convert from PDF",
  },
  {
    id: "pdf-to-png",
    title: "PDF to PNG",
    short: "Convert pages",
    description: "Convert each PDF page to a lossless PNG image.",
    icon: ImageIcon,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    accept: "application/pdf",
    multiple: false,
    category: "Convert from PDF",
  },
  {
    id: "page-numbers",
    title: "Add Page Numbers",
    short: "Number pages",
    description: "Insert page numbers anywhere on every page of your PDF.",
    icon: Hash,
    color: "text-orange-600",
    bg: "bg-orange-50",
    accept: "application/pdf",
    multiple: false,
    category: "Edit",
  },
  {
    id: "watermark-pdf",
    title: "Add Watermark",
    short: "Stamp text",
    description: "Add a custom text watermark across every page of your PDF.",
    icon: Droplets,
    color: "text-violet-600",
    bg: "bg-violet-50",
    accept: "application/pdf",
    multiple: false,
    category: "Edit",
  },
  {
    id: "protect-pdf",
    title: "Protect PDF",
    short: "Add password",
    description: "Encrypt a PDF with a password so only you can open it.",
    icon: Lock,
    color: "text-red-600",
    bg: "bg-red-50",
    accept: "application/pdf",
    multiple: false,
    category: "Security",
  },
  {
    id: "unlock-pdf",
    title: "Unlock PDF",
    short: "Remove password",
    description: "Remove the password from a PDF you own (you must know the password).",
    icon: Unlock,
    color: "text-green-600",
    bg: "bg-green-50",
    accept: "application/pdf",
    multiple: false,
    category: "Security",
  },
  {
    id: "repair-pdf",
    title: "Repair PDF",
    short: "Fix corrupt PDF",
    description: "Try to recover a damaged PDF and rebuild a clean, valid copy.",
    icon: Wrench,
    color: "text-stone-700",
    bg: "bg-stone-100",
    accept: "application/pdf",
    multiple: false,
    category: "Optimize",
  },
  {
    id: "extract-images",
    title: "Extract Images",
    short: "Pull images",
    description: "Render each PDF page as an image you can save individually.",
    icon: Images,
    color: "text-pink-600",
    bg: "bg-pink-50",
    accept: "application/pdf",
    multiple: false,
    category: "Convert from PDF",
  },
  {
    id: "ocr-pdf",
    title: "OCR PDF",
    short: "Searchable text",
    description: "Extract text from a scanned PDF using AI and save as a .txt file.",
    icon: ScanText,
    color: "text-purple-600",
    bg: "bg-purple-50",
    accept: "application/pdf",
    multiple: false,
    category: "AI",
    badge: "AI",
  },
  {
    id: "heic-to-jpg",
    title: "HEIC to JPG",
    short: "iPhone photos",
    description: "Convert iPhone HEIC photos into universally-supported JPG images.",
    icon: FileImage,
    color: "text-amber-700",
    bg: "bg-amber-50",
    accept: "image/heic,image/heif,.heic,.heif",
    multiple: true,
    category: "Images",
  },
  {
    id: "avif-to-jpg",
    title: "AVIF to JPG",
    short: "Modern → JPG",
    description: "Convert AVIF images to JPG for maximum compatibility.",
    icon: FileImage,
    color: "text-lime-700",
    bg: "bg-lime-50",
    accept: "image/avif,.avif",
    multiple: true,
    category: "Images",
  },
  {
    id: "image-convert",
    title: "Image Converter",
    short: "JPG ↔ PNG ↔ WebP",
    description: "Swap between JPG, PNG and WebP image formats in one click.",
    icon: Replace,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    accept: "image/jpeg,image/png,image/webp,image/avif,image/heic,.heic,.heif,.avif",
    multiple: true,
    category: "Images",
  },
  {
    id: "any-to-pdf",
    title: "Any → PDF",
    short: "Universal converter",
    description: "Drop almost any file (images, text, DOCX, HEIC, AVIF) and get a PDF.",
    icon: FileType2,
    color: "text-rose-700",
    bg: "bg-rose-50",
    accept: "*/*",
    multiple: true,
    category: "Convert to PDF",
  },
  {
    id: "ai-summarize",
    title: "AI Summarize PDF",
    short: "Smart summary",
    description: "Get a clear, concise AI-generated summary of any PDF document.",
    icon: Sparkles,
    color: "text-fuchsia-700",
    bg: "bg-fuchsia-50",
    accept: "application/pdf",
    multiple: false,
    category: "AI",
    badge: "AI",
  },
  {
    id: "ai-translate",
    title: "AI Translate PDF",
    short: "Translate text",
    description: "Translate the text content of a PDF into any language using AI.",
    icon: Languages,
    color: "text-sky-700",
    bg: "bg-sky-50",
    accept: "application/pdf",
    multiple: false,
    category: "AI",
    badge: "AI",
  },
];

export const TOOLS_BY_ID: Record<ToolId, Tool> = TOOLS.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {} as Record<ToolId, Tool>
);

export const CATEGORIES: ToolCategory[] = [
  "Organize",
  "Optimize",
  "Convert to PDF",
  "Convert from PDF",
  "Edit",
  "Security",
  "Images",
  "AI",
];