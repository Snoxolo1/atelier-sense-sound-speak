import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Eye, Loader2, Pause, Play, ScanLine, Square, Upload, Volume2 } from "lucide-react";
import { AiDisclaimer, SiteHeader, PageIntro } from "@/components/SiteHeader";

export const Route = createFileRoute("/detect")({
  head: () => ({
    meta: [
      { title: "Vision Intelligence — Beat Brains" },
      { name: "description", content: "Analyse a camera or video with real-time object detection, tracking, counts and spoken scene summaries." },
      { property: "og:title", content: "Vision Intelligence — Beat Brains" },
      { property: "og:description", content: "On-device vision analysis with labels, confidence, tracking and spoken descriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetectPage,
});

type Pred = { bbox: [number, number, number, number]; class: string; score: number };
type Model = { detect: (el: HTMLVideoElement) => Promise<Pred[]> };
type Track = { id: number; box: [number, number, number, number]; cls: string; miss: number; score: number; speed: number };

declare global { interface Window { cocoSsd?: { load: () => Promise<Model> } } }

function loadScript(src: string) {
  return new Promise<void>((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("download failed"));
    document.head.appendChild(s);
  });
}
let modelPromise: Promise<Model> | null = null;
function getModel() {
  modelPromise ??= (async () => {
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js");
    if (!window.cocoSsd) throw new Error("model library missing");
    return window.cocoSsd.load();
  })().catch((e) => { modelPromise = null; throw e; });
  return modelPromise;
}
function iou(a: readonly [number, number, number, number], b: readonly [number, number, number, number]) {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[0] + a[2], b[0] + b[2]), y2 = Math.min(a[1] + a[3], b[1] + b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a[2] * a[3] + b[2] * b[3] - inter || 1);
}

type Status = "idle" | "loading-model" | "running" | "paused" | "error";

function DetectPage() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const demoCanvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const tracks = useRef<Track[]>([]);
  const nextId = useRef(1);
  const [source, setSource] = useState<"none" | "file" | "camera">("none");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [demo, setDemo] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("Waiting for a source");

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }

  function reset() {
    stopAll();
    tracks.current = []; nextId.current = 1; setCount(0);
    const v = video.current;
    if (v) { v.pause(); v.srcObject = null; v.removeAttribute("src"); v.load(); }
    canvas.current?.getContext("2d")?.clearRect(0, 0, 9999, 9999);
    setSource("none"); setStatus("idle");
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    reset(); setError("");
    const v = video.current!;
    v.src = URL.createObjectURL(f);
    v.loop = true;
    setSource("file");
  }

  async function startCamera() {
    reset(); setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access isn't available in this browser (it also requires a secure https page).");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = s;
      video.current!.srcObject = s;
      await video.current!.play();
      setSource("camera");
    } catch (e) {
      setError(e instanceof DOMException && e.name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access in your browser settings and try again."
        : "Couldn't start the camera. Check that one is connected and not used by another app.");
    }
  }

  async function start() {
    setError(""); setStatus("loading-model");
    let model: Model;
    try { model = await getModel(); }
    catch {
      setStatus("error");
      setError("The detection model couldn't be downloaded (offline or blocked). Try again later, or view the labeled demo preview below.");
      return;
    }
    const v = video.current!;
    await v.play().catch(() => {});
    setStatus("running");
    const loop = async () => {
      if (v.paused || v.ended) { raf.current = requestAnimationFrame(loop); return; }
      const preds = await model.detect(v);
      updateTracks(preds.filter((p) => p.score > 0.5));
      draw();
      raf.current = requestAnimationFrame(loop);
    };
    loop();
  }

  function updateTracks(preds: Pred[]) {
    const used = new Set<number>();
    for (const t of tracks.current) {
      let best = -1, bestScore = 0.3;
      preds.forEach((p, i) => {
        if (used.has(i) || p.class !== t.cls) return;
        const s = iou(t.box, p.bbox);
        if (s > bestScore) { bestScore = s; best = i; }
      });
      if (best >= 0) {
        const next = preds[best];
        if (!next) continue;
        const oldX = t.box[0] + t.box[2] / 2, oldY = t.box[1] + t.box[3] / 2;
        const newX = next.bbox[0] + next.bbox[2] / 2, newY = next.bbox[1] + next.bbox[3] / 2;
        t.speed = Math.hypot(newX - oldX, newY - oldY); t.box = next.bbox; t.score = next.score; t.miss = 0; used.add(best);
      } else t.miss++;
    }
    preds.forEach((p, i) => { if (!used.has(i)) tracks.current.push({ id: nextId.current++, box: p.bbox, cls: p.class, miss: 0, score: p.score, speed: 0 }); });
    tracks.current = tracks.current.filter((t) => t.miss < 15);
    const visible = tracks.current.filter((t) => t.miss === 0);
    setCount(visible.length);
    setLastUpdate(visible.length ? `${visible.length} tracked · ${visible.filter((t) => t.speed > 8).length} moving` : "No recognised objects in view");
  }

  function draw() {
    const v = video.current!, c = canvas.current!;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const teal = getComputedStyle(document.documentElement).getPropertyValue("--primary");
    ctx.lineWidth = Math.max(2, c.width / 320);
    ctx.font = `600 ${Math.max(14, c.width / 50)}px Manrope, sans-serif`;
    for (const t of tracks.current) {
      if (t.miss) continue;
      const [x, y, w, h] = t.box;
      ctx.strokeStyle = teal; ctx.fillStyle = teal;
      ctx.strokeRect(x, y, w, h);
       const label = `#${t.id} ${t.cls} ${Math.round(t.score * 100)}%`;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillRect(x, y - 24, tw, 24);
      ctx.fillStyle = "oklch(0.17 0.04 240)";
      ctx.fillText(label, x + 5, y - 6);
    }
  }

  function pause() {
    const v = video.current!;
    if (status === "running") { v.pause(); setStatus("paused"); }
    else if (status === "paused") { v.play(); setStatus("running"); }
  }

  function describe() {
    if (!("speechSynthesis" in window)) { setError("Spoken descriptions are not supported in this browser."); return; }
    const visible = tracks.current.filter((t) => t.miss === 0);
    const groups = [...new Set(visible.map((t) => t.cls))];
    const movement = visible.filter((t) => t.speed > 8).length;
    const sentence = visible.length
      ? `I can see ${visible.length} tracked objects: ${groups.join(", ")}. ${movement ? `${movement} appear to be moving.` : "No strong movement is detected."}`
      : "No recognised objects are currently visible.";
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(sentence));
  }

  const visibleTracks = tracks.current.filter((t) => t.miss === 0);
  const people = visibleTracks.filter((t) => t.cls === "person").length;
  const vehicles = visibleTracks.filter((t) => ["car", "truck", "bus", "motorcycle", "bicycle"].includes(t.cls)).length;
  const animals = visibleTracks.filter((t) => ["dog", "cat", "bird", "horse", "sheep", "cow"].includes(t.cls)).length;
  const scene = vehicles ? "Road or parking area" : people ? "People-focused environment" : count ? "General environment" : "Awaiting scene data";

  // Synthetic demo animation (never touches the user's video)
  useEffect(() => {
    if (!demo) return;
    const c = demoCanvas.current!, ctx = c.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const objs = [
      { id: 1, cls: "person", x: 40, y: 80, w: 70, h: 150, vx: 1.2 },
      { id: 2, cls: "car", x: 300, y: 170, w: 140, h: 70, vx: -1.8 },
      { id: 3, cls: "dog", x: 180, y: 200, w: 70, h: 45, vx: 0.8 },
    ];
    let id = 0;
    const tick = () => {
      ctx.fillStyle = css.getPropertyValue("--secondary"); ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = css.getPropertyValue("--muted"); ctx.fillRect(0, 245, c.width, 55);
      ctx.font = "600 13px Manrope, sans-serif";
      for (const o of objs) {
        o.x += o.vx; if (o.x < 0 || o.x + o.w > c.width) o.vx *= -1;
        ctx.fillStyle = css.getPropertyValue("--surface-muted"); ctx.globalAlpha = 0.35; ctx.fillRect(o.x, o.y, o.w, o.h); ctx.globalAlpha = 1;
        ctx.strokeStyle = css.getPropertyValue("--gold"); ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = css.getPropertyValue("--gold"); ctx.fillRect(o.x, o.y - 20, 90, 20);
        ctx.fillStyle = css.getPropertyValue("--gold-foreground"); ctx.fillText(`#${o.id} ${o.cls}`, o.x + 5, o.y - 6);
      }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [demo]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <PageIntro
          title="Vision Intelligence"
          text="Analyse a live camera or video for people, animals, vehicles and everyday objects. Detection runs on your device and your footage is never uploaded."
        />
        <div className="mb-4 flex flex-wrap items-center gap-2"><span className="badge-live"><span className="mr-1 h-1.5 w-1.5 rounded-full bg-primary-foreground" /> Vision model ready</span><span className="text-xs text-muted-foreground">COCO-SSD · 80 object types · local processing</span></div>
        <div className="grid gap-5 lg:grid-cols-[1fr_21rem]">
          <section className="panel">
            <div className="scanner-grid relative overflow-hidden rounded-lg bg-background">
              <video ref={video} playsInline muted className="block aspect-video w-full object-contain" />
              <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full object-contain" aria-hidden />
              {source === "none" && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-muted-foreground">
                  Upload a video or start your camera to begin.
                </div>
              )}
              {status === "loading-model" && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading detection model (~10 MB, first time only)…
                </div>
              )}
              {status === "running" && <div className="scan-line pointer-events-none absolute inset-x-0 top-0 h-px bg-primary shadow-[0_0_14px_var(--primary)]" aria-hidden />}
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded bg-background/80 px-2 py-1 text-xs text-foreground"><ScanLine className="h-3.5 w-3.5 text-primary" /> {status === "running" ? "ANALYSING" : "STANDBY"}</div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {status === "running" && <span className="badge-live">Live detection</span>}
              {status === "paused" && <span className="badge-demo">Paused</span>}
              {(status === "running" || status === "paused") && <span>{count} object{count === 1 ? "" : "s"} in view</span>}
            </div>
            {error && <p className="note-error mt-3" role="alert">{error}</p>}
          </section>

          <aside className="panel space-y-3">
            <h2 className="text-xl">Source</h2>
            <label className="btn-ghost w-full cursor-pointer">
              <Upload className="h-4 w-4" /> Upload video
              <input type="file" accept="video/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <button className="btn-ghost w-full" onClick={startCamera}><Camera className="h-4 w-4" /> Start camera</button>
            <h2 className="pt-2 text-xl">Processing</h2>
            <button className="btn-primary w-full" onClick={start} disabled={source === "none" || status === "running" || status === "paused" || status === "loading-model"}>
              <Play className="h-4 w-4" /> Start detection
            </button>
            <button className="btn-ghost w-full" onClick={pause} disabled={status !== "running" && status !== "paused"}>
              {status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {status === "paused" ? "Resume" : "Pause"}
            </button>
            <button className="btn-ghost w-full" onClick={reset} disabled={source === "none"}><Square className="h-4 w-4" /> Stop</button>
            <button className="btn-ghost w-full" onClick={describe} disabled={status !== "running" && status !== "paused"}><Volume2 className="h-4 w-4" /> Describe scene</button>
            <p className="text-xs text-surface-foreground/65">Camera is only requested after you press “Start camera”. Your video never leaves this device.</p>
          </aside>
        </div>

        <section className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4" aria-label="Vision analysis">
          {[{ label: "Objects", value: count, note: lastUpdate }, { label: "People", value: people, note: people ? "Human presence detected" : "None detected" }, { label: "Vehicles", value: vehicles, note: animals ? `${animals} animal${animals === 1 ? "" : "s"} also seen` : "Cars, buses and bikes" }, { label: "Scene", value: scene, note: "Best-effort estimate" }].map((item) => <div key={item.label} className="bg-surface p-4 text-surface-foreground"><p className="field-label">{item.label}</p><p className="text-xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-surface-foreground/55">{item.note}</p></div>)}
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          <div className="panel"><Eye className="h-5 w-5 text-primary" /><h2 className="mt-3 text-lg">Activity signals</h2><p className="mt-2 text-sm text-surface-foreground/65">Movement speed supports basic motion alerts. Walking, sitting, waving and falling need a dedicated pose model and are not claimed here.</p></div>
          <div className="panel"><ScanLine className="h-5 w-5 text-primary" /><h2 className="mt-3 text-lg">Environment</h2><p className="mt-2 text-sm text-surface-foreground/65">Scene type is estimated from detected objects. Weather cannot be reliably confirmed by this object model.</p></div>
          <div className="panel"><Volume2 className="h-5 w-5 text-primary" /><h2 className="mt-3 text-lg">Voice assistant</h2><p className="mt-2 text-sm text-surface-foreground/65">Hear an instant summary of recognised objects, categories and visible movement.</p></div>
        </section>

        <section className="mt-8">
          <button className="btn-ghost-dark" onClick={() => setDemo((d) => !d)}>{demo ? "Hide" : "Show"} demo preview</button>
          {demo && (
            <div className="panel mt-4">
              <div className="mb-3 flex items-center gap-2"><span className="badge-demo">Demo preview</span>
                <span className="text-sm">Synthetic animated shapes with scripted boxes — not real detection, and not your video.</span></div>
              <canvas ref={demoCanvas} width={560} height={300} className="w-full rounded-xl" />
            </div>
          )}
        </section>
        <div className="mt-8"><AiDisclaimer /></div>
      </main>
    </>
  );
}
