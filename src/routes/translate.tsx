import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeftRight, Copy, Loader2, Volume2, Check } from "lucide-react";
import { SiteHeader, PageIntro } from "@/components/SiteHeader";

export const Route = createFileRoute("/translate")({
  head: () => ({
    meta: [
      { title: "Language Translation — Atelier AI" },
      { name: "description", content: "Translate text, detect the source language, copy and listen to results." },
      { property: "og:title", content: "Language Translation — Atelier AI" },
      { property: "og:description", content: "Translate text and hear it read aloud in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TranslatePage,
});

const LANGS: [string, string][] = [
  ["en", "English"], ["af", "Afrikaans"], ["zu", "isiZulu"], ["xh", "isiXhosa"], ["st", "Sesotho"],
  ["fr", "French"], ["es", "Spanish"], ["pt", "Portuguese"], ["de", "German"], ["it", "Italian"],
  ["nl", "Dutch"], ["sw", "Swahili"], ["ar", "Arabic"], ["zh-CN", "Chinese (Simplified)"],
  ["ja", "Japanese"], ["ko", "Korean"], ["hi", "Hindi"], ["ru", "Russian"], ["tr", "Turkish"],
];
const MAX = 500;

type State =
  | { kind: "empty" }
  | { kind: "loading" }
  | { kind: "success"; text: string; demo?: boolean }
  | { kind: "error"; message: string };

function TranslatePage() {
  const [src, setSrc] = useState("auto");
  const [tgt, setTgt] = useState("fr");
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "empty" });
  const [copied, setCopied] = useState(false);
  const [ttsOk, setTtsOk] = useState<boolean | null>(null);

  useEffect(() => setTtsOk(typeof window !== "undefined" && "speechSynthesis" in window), []);

  async function translate() {
    if (!text.trim()) return;
    if (src === tgt) {
      setState({ kind: "error", message: "Source and target languages are the same." });
      return;
    }
    setState({ kind: "loading" });
    try {
      const pair = `${src === "auto" ? "Autodetect" : src}|${tgt}`;
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}`,
      );
      if (!res.ok) throw new Error(`Service responded with ${res.status}`);
      const data = await res.json();
      if (data.responseStatus !== 200 && data.responseStatus !== "200") {
        throw new Error(data.responseDetails || "The translation service could not process this request.");
      }
      setState({ kind: "success", text: data.responseData.translatedText });
    } catch (e) {
      setState({
        kind: "error",
        message: `Translation unavailable right now (${e instanceof Error ? e.message : "network error"}). The free service may be rate-limited or offline.`,
      });
    }
  }

  function showDemo() {
    setText("Good morning, how are you today?");
    setSrc("en");
    setTgt("fr");
    setState({ kind: "success", text: "Bonjour, comment allez-vous aujourd'hui ?", demo: true });
  }

  function swap() {
    if (src === "auto") return;
    setSrc(tgt);
    setTgt(src);
  }

  async function copy() {
    if (state.kind !== "success") return;
    await navigator.clipboard.writeText(state.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function speak() {
    if (state.kind !== "success" || !ttsOk) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(state.text);
    u.lang = tgt;
    window.speechSynthesis.speak(u);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageIntro
          title="Language Translation"
          text="Uses the free MyMemory translation service directly from your browser — no key needed. Up to 500 characters per request; quality varies for less common languages."
        />
        <div className="panel">
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <label htmlFor="src" className="field-label">From</label>
              <select id="src" className="field" value={src} onChange={(e) => setSrc(e.target.value)}>
                <option value="auto">Detect language</option>
                {LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </div>
            <button className="btn-ghost" onClick={swap} disabled={src === "auto"} aria-label="Swap languages">
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <div>
              <label htmlFor="tgt" className="field-label">To</label>
              <select id="tgt" className="field" value={tgt} onChange={(e) => setTgt(e.target.value)}>
                {LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="input" className="field-label">Your text</label>
              <textarea
                id="input"
                className="field min-h-48 resize-y"
                maxLength={MAX}
                placeholder="Type or paste text to translate…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-surface-foreground/60">{text.length}/{MAX}</span>
                <button className="btn-primary" onClick={translate} disabled={!text.trim() || state.kind === "loading"}>
                  {state.kind === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} Translate
                </button>
              </div>
            </div>
            <div>
              <div className="field-label flex items-center gap-2">
                Translation {state.kind === "success" && (state.demo ? <span className="badge-demo">Demo sample</span> : <span className="badge-live">Live result</span>)}
              </div>
              <div className="field min-h-48 bg-surface-muted" aria-live="polite">
                {state.kind === "empty" && <p className="text-surface-foreground/55">Your translation will appear here.</p>}
                {state.kind === "loading" && <p className="flex items-center gap-2 text-surface-foreground/70"><Loader2 className="h-4 w-4 animate-spin" /> Translating…</p>}
                {state.kind === "success" && <p className="whitespace-pre-wrap text-base">{state.text}</p>}
                {state.kind === "error" && (
                  <div className="note-error">
                    {state.message}
                    <button className="mt-2 block font-semibold underline" onClick={showDemo}>Show a labeled demo example instead</button>
                  </div>
                )}
              </div>
              {state.kind === "success" && state.demo && (
                <p className="note mt-2">This is a fixed sample to show the layout — it is not a translation of your text.</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-ghost" onClick={copy} disabled={state.kind !== "success"}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
                </button>
                <button className="btn-ghost" onClick={speak} disabled={state.kind !== "success" || !ttsOk}>
                  <Volume2 className="h-4 w-4" /> Listen
                </button>
              </div>
              {ttsOk === false && <p className="note mt-2">Read-aloud isn't supported in this browser.</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
