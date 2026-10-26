import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Layers as LayersIcon, Loader2, Pause, Play, Sparkles, Volume2, Waves } from "lucide-react";
import { AiDisclaimer, PageIntro, SiteHeader } from "@/components/SiteHeader";
import { hash, renderLoop, toWav, type Layers, type Mood, type Sections, type SoundChoice } from "@/lib/synth";
import { Button } from "@/components/ui/button";
import { BPM_RANGES, MUSIC_GENRES, clampTempoFor, type Genre } from "@/lib/music-direction";
import studioImage from "@/assets/amapiano-studio.jpg";

export const Route = createFileRoute("/music")({
  head: () => ({ meta: [
    { title: "Music Studio — Beat Brains" },
    { name: "description", content: "Choose Amapiano, Jazz, R&B or Hip-Hop and shape an original instrumental with drums, melody, bass, build-ups, drops and transitions." },
    { property: "og:title", content: "Music Studio — Beat Brains" },
    { property: "og:description", content: "Pick your genre, sound and arrangement, then create an original groove with build-ups, drops and transitions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: MusicPage,
});

const GENRE_OPTIONS: [Genre, string, string][] = [
  ["amapiano", "Amapiano", "Log drums & township groove"],
  ["jazz", "Jazz", "Swinging walking bass"],
  ["rnb", "R&B", "Smooth soul chords"],
  ["hiphop", "Hip-Hop", "Boom-bap drums & sub bass"],
];
const MOODS: [Mood, string, string][] = [
  ["chill", "Late night", "Warm and intimate"], ["moody", "Nostalgic", "Deep and emotional"],
  ["uplifting", "Uplifting", "Hopeful and bright"], ["energetic", "Festival", "Big and energetic"],
];
const SOUND_OPTIONS: [SoundChoice, string][] = [
  ["piano", "Warm piano"], ["epiano", "Electric keys"], ["pad", "Lush pads"], ["pluck", "Soft plucks"],
];
const LAYER_OPTIONS: [keyof Layers, string][] = [["drums", "Drums"], ["melody", "Melody"], ["bass", "Bass"]];
const SECTION_OPTIONS: [keyof Sections, string][] = [["buildup", "Build-up"], ["drop", "Drop"], ["transition", "Transition"]];
const TITLES: Record<Genre, string> = {
  amapiano: "Midnight in Mzansi", jazz: "Blue Note Nights", rnb: "Velvet Hours", hiphop: "Street Cypher", afrobeat: "Lagos Lights", lofi: "Rainy Window",
};
type State = { kind: "empty" } | { kind: "loading" } | { kind: "ready"; url: string; name: string } | { kind: "error"; message: string };
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function MusicPage() {
  const [genre, setGenre] = useState<Genre>("amapiano");
  const [mood, setMood] = useState<Mood>("moody");
  const [bpm, setBpm] = useState<number>(BPM_RANGES.amapiano.default);
  const [seconds, setSeconds] = useState(30);
  const [sound, setSound] = useState<SoundChoice>("piano");
  const [layers, setLayers] = useState<Layers>({ drums: true, melody: true, bass: true });
  const [sections, setSections] = useState<Sections>({ buildup: true, drop: true, transition: true });
  const [state, setState] = useState<State>({ kind: "empty" });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const range = BPM_RANGES[genre];

  useEffect(() => () => { if (state.kind === "ready") URL.revokeObjectURL(state.url); }, [state]);

  function pickGenre(next: Genre) {
    setGenre(next);
    setBpm(BPM_RANGES[next].default);
  }
  function toggleLayer(key: keyof Layers) { setLayers((prev) => ({ ...prev, [key]: !prev[key] })); }
  function toggleSection(key: keyof Sections) { setSections((prev) => ({ ...prev, [key]: !prev[key] })); }

  async function generate() {
    if (typeof OfflineAudioContext === "undefined") return setState({ kind: "error", message: "This browser cannot create audio loops." });
    setState({ kind: "loading" }); setPlaying(false);
    try {
      const buf = await renderLoop({ genre, mood, bpm: clampTempoFor(genre, bpm), seconds, seed: hash(`${genre}-${mood}-${sound}-${Date.now()}`), sound, layers, sections });
      const url = URL.createObjectURL(toWav(buf));
      setState({ kind: "ready", url, name: `beat-brains-${genre}-${bpm}bpm.wav` });
      setTime(0);
    } catch (error) { setState({ kind: "error", message: `The track could not be created: ${error instanceof Error ? error.message : "unknown error"}` }); }
  }

  function toggle() { const el = audio.current; if (el) el.paused ? void el.play() : el.pause(); }

  return <>
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 py-10">
      <PageIntro title="Music Studio" text="Pick a genre — Amapiano, Jazz, R&B or Hip-Hop — then choose your sounds and arrangement to create an original instrumental groove." />
      <div className="mb-6 flex flex-wrap gap-2">
        {["Amapiano", "Jazz", "R&B", "Hip-Hop", "Build-ups", "Drops", "Transitions", "Sound selection"].map((item) => <span key={item} className="badge-demo">{item}</span>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        <section className="panel space-y-5" aria-label="Track direction">
          <div><span className="field-label">Genre</span><div className="grid grid-cols-2 gap-2" role="radiogroup">
            {GENRE_OPTIONS.map(([value, label, note]) => <Button key={value} role="radio" aria-checked={genre === value} variant={genre === value ? "default" : "outline"} className="min-h-16 flex-col whitespace-normal" onClick={() => pickGenre(value)}><span>{label}</span><span className="text-xs font-normal opacity-75">{note}</span></Button>)}
          </div></div>
          <div><span className="field-label">Emotional direction</span><div className="grid grid-cols-2 gap-2" role="radiogroup">
            {MOODS.map(([value, label, note]) => <Button key={value} role="radio" aria-checked={mood === value} variant={mood === value ? "default" : "outline"} className="min-h-16 flex-col whitespace-normal" onClick={() => setMood(value)}><span>{label}</span><span className="text-xs font-normal opacity-75">{note}</span></Button>)}
          </div></div>
          <div><label htmlFor="sound" className="field-label">Sound selection</label>
            <select id="sound" className="field" value={sound} onChange={(e) => setSound(e.target.value as SoundChoice)}>
              {SOUND_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div><span className="field-label"><LayersIcon className="mr-1 inline h-4 w-4" aria-hidden /> Layers</span>
            <div className="flex flex-wrap gap-2">{LAYER_OPTIONS.map(([key, label]) => <Button key={key} aria-pressed={layers[key]} variant={layers[key] ? "default" : "outline"} className="h-9" onClick={() => toggleLayer(key)}>{label}{layers[key] ? " on" : " off"}</Button>)}</div>
          </div>
          <div><span className="field-label"><Waves className="mr-1 inline h-4 w-4" aria-hidden /> Arrangement</span>
            <div className="flex flex-wrap gap-2">{SECTION_OPTIONS.map(([key, label]) => <Button key={key} aria-pressed={sections[key]} variant={sections[key] ? "default" : "outline"} className="h-9" onClick={() => toggleSection(key)}>{label}{sections[key] ? " on" : " off"}</Button>)}</div>
          </div>
          <div><label htmlFor="bpm" className="field-label">Tempo — {bpm} BPM</label><input id="bpm" type="range" min={range.min} max={range.max} value={clampTempoFor(genre, bpm)} onChange={(e) => setBpm(clampTempoFor(genre, +e.target.value))} className="w-full accent-primary" /><div className="flex justify-between text-xs text-surface-foreground/55"><span>{range.min} BPM</span><span>{range.max} BPM</span></div></div>
          <div><label htmlFor="duration" className="field-label">Length</label><select id="duration" className="field" value={seconds} onChange={(e) => setSeconds(+e.target.value)}><option value={15}>15-second sketch</option><option value={30}>30-second groove</option><option value={60}>60-second extended groove</option></select></div>
          <Button className="btn-gold h-auto w-full whitespace-normal" onClick={generate} disabled={state.kind === "loading"}>{state.kind === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create {GENRE_OPTIONS.find(([g]) => g === genre)?.[1] ?? "music"} track</Button>
        </section>

        <section className="panel flex min-h-[30rem] flex-col" aria-label="Track preview">
          <img src={studioImage} alt="Piano and music console overlooking Johannesburg at night" width={1536} height={1024} className="mb-4 aspect-[3/1] w-full rounded-lg object-cover" />
          <div className="flex items-center justify-between"><div><p className="field-label">Now creating</p><h2 className="text-2xl">{TITLES[genre]}</h2></div><Volume2 className="h-6 w-6 text-primary" aria-hidden /></div>
          <div className="my-5 flex h-24 items-center justify-center gap-1 overflow-hidden rounded-lg bg-surface-muted px-4" aria-hidden>
            {[35,60,82,45,92,68,38,75,100,55,86,42,70,95,48,78,62,88,40,72,52,90,65,36].map((h, i) => <span key={i} className="w-1.5 rounded-full bg-primary" style={{ height: `${state.kind === "loading" ? Math.max(20, (h + Date.now()) % 100) : h}%` }} />)}
          </div>
          <div className="flex-1" aria-live="polite">
            {state.kind === "empty" && <p className="text-center text-surface-foreground/60">Choose your genre, sound and arrangement, then create your groove.</p>}
            {state.kind === "loading" && <p className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Arranging drums, bass and melody…</p>}
            {state.kind === "error" && <p className="note-error">{state.message}</p>}
            {state.kind === "ready" && <>
              <audio ref={audio} src={state.url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
              <div className="flex items-center gap-3"><Button className="btn-primary h-12 w-12 !rounded-full !p-0" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</Button><div className="flex-1"><input type="range" aria-label="Seek" min={0} max={dur || 0} step={0.1} value={time} onChange={(e) => { if (audio.current) audio.current.currentTime = +e.target.value; }} className="w-full accent-primary" /><div className="flex justify-between text-xs"><span>{fmt(time)}</span><span>{fmt(dur)}</span></div></div></div>
              <a className="btn-ghost mt-4" href={state.url} download={state.name}><Download className="h-4 w-4" /> Download WAV</a>
            </>}
          </div>
          <p className="mt-4 text-xs text-surface-foreground/60">Procedural instrumental, not AI-generated music. Toggle layers and arrangement sections to shape the track.</p>
        </section>
      </div>
      <div className="mt-8"><AiDisclaimer /></div>
    </main>
  </>;
}
