import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages, Music2, ScanEye, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier AI — Translate, Compose, Detect" },
      { name: "description", content: "Three browser-based AI tools: language translation, music loop generation and object detection." },
      { property: "og:title", content: "Atelier AI — Translate, Compose, Detect" },
      { property: "og:description", content: "Three browser-based AI tools in one elegant workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tools = [
  { to: "/translate", icon: Languages, title: "Language Translation", text: "Translate text between dozens of languages, copy the result, and hear it read aloud.", tag: "Live free service" },
  { to: "/music", icon: Music2, title: "Music Generation", text: "Shape Amapiano, R&B, jazz, Afrobeat or lo-fi loops by mood and tempo, then download.", tag: "Browser demo synth" },
  { to: "/detect", icon: ScanEye, title: "Object Detection", text: "Spot and track people and objects in a video or your camera, right on your device.", tag: "On-device model" },
] as const;

function Index() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">A small studio of AI tools</p>
        <h1 className="mt-3 max-w-3xl text-4xl sm:text-6xl text-foreground">
          Translate, compose and see — <em className="text-primary">honestly</em>, in your browser.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          No accounts, no stored data. Each tool tells you exactly what runs for real and what is a demo.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {tools.map((t) => (
            <Link key={t.to} to={t.to} className="panel group flex flex-col transition hover:-translate-y-1">
              <t.icon className="h-9 w-9 text-primary" aria-hidden />
              <h2 className="mt-4 text-2xl">{t.title}</h2>
              <p className="mt-2 flex-1 text-sm text-surface-foreground/75">{t.text}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-surface-foreground/60">{t.tag}</span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
