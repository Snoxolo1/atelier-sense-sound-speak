import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Pause, Play, Wand2 } from "lucide-react";
import { SiteHeader, PageIntro } from "@/components/SiteHeader";
import { hash, renderLoop, toWav, type Genre, type Mood } from "@/lib/synth";

export const Route = createFileRoute("/music")({
  head: () => ({
    meta: [
      { title: "Music Generation — Atelier AI" },
      { name: "description", content: "Create Amapiano, R&B, jazz, Afrobeat and lo-fi instrumental loops in your browser." },
      { property: "og:title", content: "Music Generation — Atelier AI" },
      { property: "og:description", content: "Shape genre, mood and tempo, then preview and download a loop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MusicPage,
});

const GENRES: [Genre, string][] = [["amapiano", "Amapiano"], ["rnb", "R&B"], ["jazz", "Jazz"], ["afrobeat", "Afrobeat"], ["lofi", "Lo-fi"]];
const MOODS: [Mood, string][] = [["chill", "Chill"], ["uplifting", "Uplifting"], ["moody", "Moody"], ["energetic", "Energetic"]];
const DEFAULT_BPM: Record<Genre, number> = { amapiano: 112, rnb: 85, jazz: 120, afrobeat: 105, lofi: 78 };

type State = { kind: "empty" } | { kind: "loading" } | { kind: "ready"; url: string; name: string } | { kind: "error"; message: string };

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function MusicPage() {
  const [genre, setGenre] = useState<Genre>("amapiano");
  const [mood, setMood] = useState<Mood>("chill");
  const [bpm, setBpm] = useState(112);
  const [seconds, setSeconds] = useState(30);
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>({ kind: "empty" });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => () => { if (state.kind === "ready") URL.revokeObjectURL(state.url); }, [state]);

  async function generate() {
    if (typeof OfflineAudioContext === "undefined") {
      setState({ kind: "error", message: "Your browser doesn't support the Web Audio API needed to build the loop." });
      return;
    }
    setState({ kind: "loading" });
    setPlaying(false);
    try {
      const buf = await renderLoop({ genre, mood, bpm, seconds, seed: hash(prompt + genre + mood + Date.now()) });
      const url = URL.createObjectURL(toWav(buf));
      setState({ kind: "ready", url, name: `${genre}-${mood}-${bpm}bpm-demo.wav` });
      setTime(0);
    } catch (e) {
      setState({ kind: "error", message: `Couldn't render the loop: ${e instanceof Error ? e.message : "unknown error"}` });
    }
  }

  function toggle() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) { a.play(); } else { a.pause(); }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageIntro
          title="Music Generation"
          text="Real AI music generation needs a paid model and a server, which this browser-only app doesn't have. Instead, a built-in synthesizer composes an original instrumental loop from your choices."
        />
        <p className="mb-6 max-w-3xl rounded-lg border-l-4 border-gold bg-secondary px-3 py-2 text-sm text-foreground">
          <span className="badge-demo mr-2">Demo mode</span>
          Loops are made by simple rule-based sound synthesis — not by AI. Your prompt only varies the randomness; it isn't interpreted.
        </p>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className="panel space-y-5" aria-label="Loop settings">
            <div>
              <span className="field-label">Genre</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Genre">
                {GENRES.map(([g, n]) => (
                  <button key={g} role="radio" aria-checked={genre === g}
                    className={genre === g ? "btn-primary" : "btn-ghost"}
                    onClick={() => { setGenre(g); setBpm(DEFAULT_BPM[g]); }}>{n}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mood" className="field-label">Mood</label>
                <select id="mood" className="field" value={mood} onChange={(e) => setMood(e.target.value as Mood)}>
                  {MOODS.map(([m, n]) => <option key={m} value={m}>{n}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="dur" className="field-label">Duration</label>
                <select id="dur" className="field" value={seconds} onChange={(e) => setSeconds(+e.target.value)}>
                  {[15, 30, 60].map((s) => <option key={s} value={s}>{s} seconds</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="bpm" className="field-label">Tempo — {bpm} BPM</label>
              <input id="bpm" type="range" min={60} max={140} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-full accent-primary" />
            </div>
            <div>
              <label htmlFor="prompt" className="field-label">Describe the sound (optional)</label>
              <textarea id="prompt" className="field min-h-20" placeholder="e.g. warm late-night groove with soft keys" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </div>
            <button className="btn-gold w-full" onClick={generate} disabled={state.kind === "loading"}>
              {state.kind === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate demo loop
            </button>
          </section>

          <section className="panel flex flex-col" aria-label="Playback">
            <h2 className="text-2xl">Playback</h2>
            <div className="mt-4 flex flex-1 flex-col justify-center rounded-xl bg-surface-muted p-5" aria-live="polite">
              {state.kind === "empty" && <p className="text-center text-surface-foreground/60">Pick your settings and press Generate.</p>}
              {state.kind === "loading" && <p className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Composing your loop…</p>}
              {state.kind === "error" && <p className="note-error">{state.message}</p>}
              {state.kind === "ready" && (
                <>
                  <div className="flex items-center gap-2"><span className="badge-demo">Demo loop</span><span className="truncate text-sm">{state.name}</span></div>
                  <audio ref={audio} src={state.url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
                    onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
                  <div className="mt-5 flex items-center gap-4">
                    <button className="btn-primary h-12 w-12 !rounded-full !p-0" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    <div className="flex-1">
                      <input type="range" aria-label="Seek" min={0} max={dur || 0} step={0.1} value={time}
                        onChange={(e) => { if (audio.current) audio.current.currentTime = +e.target.value; }} className="w-full accent-primary" />
                      <div className="flex justify-between text-xs text-surface-foreground/60"><span>{fmt(time)}</span><span>{fmt(dur)}</span></div>
                    </div>
                  </div>
                  <a className="btn-ghost mt-5 self-start" href={state.url} download={state.name}><Download className="h-4 w-4" /> Download WAV</a>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
