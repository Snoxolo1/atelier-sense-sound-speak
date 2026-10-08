import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Pause, Play, Sparkles, Volume2 } from "lucide-react";
import { AiDisclaimer, PageIntro, SiteHeader } from "@/components/SiteHeader";
import { hash, renderLoop, toWav, type Mood } from "@/lib/synth";

export const Route = createFileRoute("/music")({
  head: () => ({ meta: [
    { title: "Amapiano Studio — Beat Brains" },
    { name: "description", content: "Create an original South African Amapiano instrumental and sing-along lyric concept from your story." },
    { property: "og:title", content: "Amapiano Studio — Beat Brains" },
    { property: "og:description", content: "Shape an emotional Amapiano groove with warm keys, log drums and a festival-ready chorus." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MusicPage,
});

const MOODS: [Mood, string, string][] = [
  ["chill", "Late night", "Warm and intimate"], ["moody", "Nostalgic", "Deep and emotional"],
  ["uplifting", "Uplifting", "Hopeful and bright"], ["energetic", "Festival", "Big and energetic"],
];
type State = { kind: "empty" } | { kind: "loading" } | { kind: "ready"; url: string; name: string; lyrics: string[] } | { kind: "error"; message: string };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function lyricConcept(topic: string, mood: Mood) {
  const idea = topic.trim() || "beautiful moments";
  const calls: Record<Mood, string> = { chill: "Hamba nami, stay with me", moody: "Khumbula, remember us", uplifting: "Siyaphakama, we rise", energetic: "Woza, masidanseni" };
  return [
    `[Verse] ${idea} in the city lights / We carry every dream into the night`,
    `[Pre-chorus] ${calls[mood]} / Feel the rhythm, feel the love tonight`,
    `[Chorus] Oh, ${idea} — siyaphila / Hold on to the feeling, sing it louder / Oh, ${idea} — asihambe / Side by side, we're moving forward`,
    `[Chant] Yebo, yebo / Woza, woza / Amandla, uthando, ekhaya`,
  ];
}

function MusicPage() {
  const [mood, setMood] = useState<Mood>("moody");
  const [bpm, setBpm] = useState(113);
  const [seconds, setSeconds] = useState(30);
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<State>({ kind: "empty" });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => () => { if (state.kind === "ready") URL.revokeObjectURL(state.url); }, [state]);

  async function generate() {
    if (typeof OfflineAudioContext === "undefined") return setState({ kind: "error", message: "This browser cannot create audio loops." });
    setState({ kind: "loading" }); setPlaying(false);
    try {
      const buf = await renderLoop({ genre: "amapiano", mood, bpm, seconds, seed: hash(`${topic}-${mood}-${Date.now()}`) });
      const url = URL.createObjectURL(toWav(buf));
      setState({ kind: "ready", url, name: `beat-brains-amapiano-${bpm}bpm.wav`, lyrics: lyricConcept(topic, mood) });
      setTime(0);
    } catch (error) { setState({ kind: "error", message: `The track could not be created: ${error instanceof Error ? error.message : "unknown error"}` }); }
  }

  function toggle() { const el = audio.current; if (el) el.paused ? void el.play() : el.pause(); }

  return <>
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageIntro title="Amapiano Studio" text="Turn any story — love, life, school, work or a beautiful moment — into an original South African Amapiano instrumental and sing-along lyric concept." />
      <div className="mb-6 flex flex-wrap gap-2">
        {["Warm piano", "Deep log drum", "Jazz harmony", "R&B soul", "Zulu-inspired chants", "Club-ready"].map((item) => <span key={item} className="badge-demo">{item}</span>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        <section className="panel space-y-5" aria-label="Track direction">
          <div><label htmlFor="topic" className="field-label">What should the song be about?</label>
            <textarea id="topic" className="field min-h-28" placeholder="A first love, finishing school, family, chasing a dream…" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={240} />
            <p className="mt-1 text-right text-xs text-surface-foreground/55">{topic.length}/240</p>
          </div>
          <div><span className="field-label">Emotional direction</span><div className="grid grid-cols-2 gap-2" role="radiogroup">
            {MOODS.map(([value, label, note]) => <button key={value} role="radio" aria-checked={mood === value} className={mood === value ? "btn-primary min-h-16 flex-col" : "btn-ghost min-h-16 flex-col"} onClick={() => setMood(value)}><span>{label}</span><span className="text-xs font-normal opacity-75">{note}</span></button>)}
          </div></div>
          <div><label htmlFor="bpm" className="field-label">Tempo — {bpm} BPM</label><input id="bpm" type="range" min={112} max={115} value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-full accent-primary" /><div className="flex justify-between text-xs text-surface-foreground/55"><span>112 · deep</span><span>115 · driving</span></div></div>
          <div><label htmlFor="duration" className="field-label">Length</label><select id="duration" className="field" value={seconds} onChange={(e) => setSeconds(+e.target.value)}><option value={15}>15-second sketch</option><option value={30}>30-second groove</option><option value={60}>60-second extended groove</option></select></div>
          <button className="btn-gold w-full" onClick={generate} disabled={state.kind === "loading"}>{state.kind === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create Amapiano track</button>
        </section>

        <section className="panel flex min-h-[30rem] flex-col" aria-label="Track preview">
          <div className="flex items-center justify-between"><div><p className="field-label">Now creating</p><h2 className="text-2xl">Midnight in Mzansi</h2></div><Volume2 className="h-6 w-6 text-primary" aria-hidden /></div>
          <div className="my-5 flex h-24 items-center justify-center gap-1 overflow-hidden rounded-lg bg-surface-muted px-4" aria-hidden>
            {[35,60,82,45,92,68,38,75,100,55,86,42,70,95,48,78,62,88,40,72,52,90,65,36].map((h, i) => <span key={i} className="w-1.5 rounded-full bg-primary" style={{ height: `${state.kind === "loading" ? Math.max(20, (h + Date.now()) % 100) : h}%` }} />)}
          </div>
          <div className="flex-1" aria-live="polite">
            {state.kind === "empty" && <p className="text-center text-surface-foreground/60">Describe your story, choose the feeling, then create your groove.</p>}
            {state.kind === "loading" && <p className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Arranging piano, bass and percussion…</p>}
            {state.kind === "error" && <p className="note-error">{state.message}</p>}
            {state.kind === "ready" && <>
              <audio ref={audio} src={state.url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
              <div className="flex items-center gap-3"><button className="btn-primary h-12 w-12 !rounded-full !p-0" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button><div className="flex-1"><input type="range" aria-label="Seek" min={0} max={dur || 0} step={0.1} value={time} onChange={(e) => { if (audio.current) audio.current.currentTime = +e.target.value; }} className="w-full accent-primary" /><div className="flex justify-between text-xs"><span>{fmt(time)}</span><span>{fmt(dur)}</span></div></div></div>
              <div className="mt-5 rounded-lg bg-surface-muted p-4"><h3 className="mb-2 text-sm font-semibold uppercase text-primary">Sing-along concept</h3>{state.lyrics.map((line) => <p key={line} className="mb-2 text-sm">{line}</p>)}</div>
              <a className="btn-ghost mt-4" href={state.url} download={state.name}><Download className="h-4 w-4" /> Download WAV</a>
            </>}
          </div>
          <p className="mt-4 text-xs text-surface-foreground/60">Original browser-made instrumental. Lyrics are a writing concept; no studio vocal is synthesized.</p>
        </section>
      </div>
      <div className="mt-8"><AiDisclaimer /></div>
    </main>
  </>;
}