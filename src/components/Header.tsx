import { Link } from "react-router-dom";
import { FileStack } from "lucide-react";

export const Header = () => (
  <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
    <div className="container flex h-16 items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-elegant">
          <FileStack className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">
          PDF<span className="text-gradient">changer</span>
        </span>
      </Link>
      <nav className="hidden items-center gap-6 text-sm sm:flex">
        <Link
          to="/"
          className="text-muted-foreground transition-smooth hover:text-foreground"
        >
          All tools
        </Link>
        <Link
          to="/tool/merge-pdf"
          className="text-muted-foreground transition-smooth hover:text-foreground"
        >
          Merge
        </Link>
        <Link
          to="/tool/split-pdf"
          className="text-muted-foreground transition-smooth hover:text-foreground"
        >
          Split
        </Link>
        <Link
          to="/tool/compress-pdf"
          className="text-muted-foreground transition-smooth hover:text-foreground"
        >
          Compress
        </Link>
      </nav>
    </div>
  </header>
);