import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages, Music2, ScanEye, ArrowRight } from "lucide-react";
import { AiDisclaimer, SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beat Brains — Amapiano, Translate, Vision" },
      { name: "description", content: "Create original Amapiano grooves, translate language and explore real-time computer vision." },
      { property: "og:title", content: "Beat Brains — Amapiano, Translate, Vision" },
      { property: "og:description", content: "Creative sound and computer vision tools in one focused workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tools = [
  { to: "/translate", icon: Languages, title: "Language Translation", text: "Translate text between dozens of languages, copy the result, and hear it read aloud.", tag: "Live free service" },
  { to: "/music", icon: Music2, title: "Amapiano Studio", text: "Turn your story into a warm, deep Amapiano groove with log drums, jazz harmony and sing-along lyrics.", tag: "Original browser audio" },
  { to: "/detect", icon: ScanEye, title: "Vision Intelligence", text: "Detect and track people, animals, vehicles and objects with live confidence and scene summaries.", tag: "On-device vision" },
] as const;

function Index() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Sound meets intelligence</p>
        <h1 className="mt-3 max-w-3xl text-4xl sm:text-6xl text-foreground">
          Create the rhythm. Understand the world.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Build an Amapiano idea from your story, translate across languages, or analyse a live camera scene.
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
        <div className="mt-10"><AiDisclaimer /></div>
      </main>
    </>
  );
}
