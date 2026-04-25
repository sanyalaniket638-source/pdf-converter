import { File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  files: File[];
  onRemove: (i: number) => void;
  onMove?: (from: number, to: number) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const FileList = ({ files, onRemove, onMove }: Props) => (
  <ul className="space-y-2">
    {files.map((f, i) => (
      <li
        key={`${f.name}-${i}`}
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <FileIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{f.name}</p>
          <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
        </div>
        {onMove && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(i, Math.max(0, i - 1))}
              disabled={i === 0}
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(i, Math.min(files.length - 1, i + 1))}
              disabled={i === files.length - 1}
            >
              ↓
            </Button>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(i)}
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </Button>
      </li>
    ))}
  </ul>
);