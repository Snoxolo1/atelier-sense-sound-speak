import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const links = [
  { to: "/translate", label: "Translate" },
  { to: "/music", label: "Music" },
  { to: "/detect", label: "Detect" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl text-foreground">
          <Sparkles className="h-5 w-5 text-gold" aria-hidden /> Atelier AI
        </Link>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm bg-secondary text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PageIntro({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl sm:text-4xl text-foreground">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{text}</p>
    </div>
  );
}
