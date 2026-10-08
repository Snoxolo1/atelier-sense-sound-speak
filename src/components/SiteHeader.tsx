import { Link } from "@tanstack/react-router";
import { AudioWaveform } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { to: "/translate", label: "Translate" },
  { to: "/music", label: "Music" },
  { to: "/detect", label: "Detect" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><AudioWaveform className="h-5 w-5" aria-hidden /></span>
          Beat Brains
        </Link>
        <div className="flex items-center gap-2">
        <nav className="hidden gap-1 sm:flex">
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
        <ThemeToggle />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl justify-center gap-1 border-t border-border px-4 py-2 sm:hidden">
        {links.map((l) => <Link key={l.to} to={l.to} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm bg-secondary text-foreground" }}>{l.label}</Link>)}
      </nav>
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

export function AiDisclaimer() {
  return <p className="disclaimer">AI can make mistakes. Please check important info.</p>;
}
