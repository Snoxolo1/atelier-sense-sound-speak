// Procedural (non-AI) instrumental loop renderer using the Web Audio API.
import { clampAmapianoTempo } from "@/lib/music-direction";
export type Genre = "amapiano" | "rnb" | "jazz" | "afrobeat" | "lofi";
export type Mood = "chill" | "uplifting" | "moody" | "energetic";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const PROGS: Record<Genre, number[]> = {
  amapiano: [0, 5, 3, 4], rnb: [1, 4, 0, 5], jazz: [1, 4, 0, 0], afrobeat: [0, 3, 4, 3], lofi: [3, 2, 1, 0],
};

export async function renderLoop(opts: { genre: Genre; mood: Mood; bpm: number; seconds: number; seed: number }) {
  const sr = 44100;
  if (!Number.isFinite(opts.seconds) || opts.seconds <= 0) throw new Error("Track duration must be positive.");
  const ctx = new OfflineAudioContext(2, Math.round(sr * opts.seconds), sr);
  const r = rng(opts.seed);
  const master = ctx.createGain();
  master.gain.value = 0.62;
  master.gain.setValueAtTime(0.62, Math.max(0, opts.seconds - .06));
  master.gain.linearRampToValueAtTime(0, opts.seconds);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = opts.genre === "lofi" ? 3500 : 12000;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.ratio.value = 12;
  master.connect(lp).connect(limiter).connect(ctx.destination);

  const scale = opts.mood === "uplifting" || opts.mood === "energetic" ? MAJOR : MINOR;
  const root = 45 + Math.floor(r() * 7);
  const beat = 60 / (opts.genre === "amapiano" ? clampAmapianoTempo(opts.bpm) : opts.bpm);
  const bar = beat * 4;
  const prog = PROGS[opts.genre];
  const noiseBuf = ctx.createBuffer(1, sr, sr);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const tone = (t: number, f: number, d: number, g: number, type: OscillatorType = "sine", glide?: number) => {
    if (t >= opts.seconds) return;
    const o = ctx.createOscillator();
    const a = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + d);
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + 0.01);
    a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(a).connect(master);
    o.start(t);
    o.stop(t + d + 0.05);
  };
  const noise = (t: number, d: number, g: number, hp: number) => {
    if (t >= opts.seconds) return;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const a = ctx.createGain();
    a.gain.setValueAtTime(g, t);
    a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(a).connect(master);
    s.start(t);
    s.stop(t + d);
  };
  const deg = (d: number, oct = 0) => root + (scale[((d % 7) + 7) % 7] ?? 0) + 12 * (Math.floor(d / 7) + oct);

  const kickSteps: Record<Genre, number[]> = {
    amapiano: [0, 4, 8, 12], rnb: [0, 7, 10], jazz: [], afrobeat: [0, 6, 10], lofi: [0, 7, 10],
  };
  const snareSteps: Record<Genre, number[]> = {
    amapiano: [4, 12], rnb: [4, 12], jazz: [4, 12], afrobeat: [4, 11, 14], lofi: [4, 12],
  };
  const swing = opts.genre === "jazz" || opts.genre === "lofi" ? 0.33 : 0;
  const step16 = beat / 4;

  for (let b = 0; b * bar < opts.seconds; b++) {
    const t0 = b * bar;
    const chordDeg = prog[b % prog.length] ?? 0;
    for (let s = 0; s < 16; s++) {
      const t = t0 + s * step16 + (s % 2 ? swing * step16 : 0);
      if (t >= opts.seconds) break;
      if (kickSteps[opts.genre].includes(s)) tone(t, 125, 0.38, 0.82, "sine", 42);
      if (snareSteps[opts.genre].includes(s)) {
        if (opts.genre === "jazz") noise(t, 0.25, 0.12, 4000);
        else { noise(t, 0.18, 0.35, 1500); tone(t, 200, 0.08, 0.2, "triangle"); }
      }
      const hatDensity = opts.mood === "energetic" ? 1 : 2;
      if (s % hatDensity === 0) noise(t, 0.04, opts.genre === "jazz" ? 0.1 : 0.14 + (s % 4 === 2 ? 0.08 : 0), 7000);
      if (opts.genre === "amapiano" && (s === 3 || s === 6 || s === 10 || s === 13 || (s === 15 && r() > 0.35))) {
        const bass = midi(deg(chordDeg, -2)) * 2;
        tone(t, bass * 2.8, 0.52, 0.74, "sine", bass); // deep pitched log drum
        if (s === 6 || s === 13) tone(t + step16 * 0.35, bass * 1.6, 0.28, 0.34, "triangle", bass * 0.9);
      }
      if (opts.genre === "afrobeat" && [2, 3, 7, 11, 15].includes(s)) tone(t, 680, 0.05, 0.15, "square"); // cowbell-ish
      if (opts.genre === "jazz" && s % 4 === 0) tone(t, midi(deg(chordDeg + (s / 4) * 2, -1)), beat * 0.9, 0.35, "triangle"); // walking bass
    }
    // bass (non-jazz)
    if (opts.genre !== "jazz" && opts.genre !== "amapiano") {
      [0, 1.5, 2.5].forEach((p) => tone(t0 + p * beat, midi(deg(chordDeg, -1)), beat * 0.8, 0.45, "triangle"));
    }
    // chords
    const chord = [0, 2, 4, opts.genre === "jazz" || opts.genre === "rnb" || opts.genre === "lofi" || opts.genre === "amapiano" ? 6 : 7].map((x) => deg(chordDeg + x, 1));
    const hits = opts.genre === "afrobeat" ? [0, 1.5, 2.5, 3.5] : opts.genre === "amapiano" ? [0, 1.75, 2.5] : [0];
    const len = hits.length > 1 ? beat * 0.4 : bar * 0.95;
    for (const h of hits) for (const n of chord) if (t0 + h * beat < opts.seconds) {
      tone(t0 + h * beat, midi(n), len, opts.genre === "amapiano" ? 0.075 : 0.06, opts.genre === "rnb" ? "sine" : "triangle");
      if (opts.genre === "amapiano") tone(t0 + h * beat, midi(n) / 2, len * 0.85, 0.025, "sine");
    }
    // melody sprinkle
    for (let m = 0; m < 4; m++) if (r() > 0.55) tone(t0 + m * beat + (r() > 0.5 ? beat / 2 : 0), midi(deg(Math.floor(r() * 7), 2)), beat * 0.6, 0.07, "sine");
    if (opts.genre === "amapiano" && b % 4 === 3) {
      [0, .5, 1, 1.5, 2, 2.5, 3, 3.5].forEach((p, i) => noise(t0 + p * beat, 0.05, 0.1 + i * 0.015, 5400));
      [0, 2, 4, 6].forEach((d, i) => tone(t0 + (2 + i * .45) * beat, midi(deg(d, 2)), beat * .38, .065, "sine"));
    }
  }

  return ctx.startRendering();
}

export function toWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const w = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); out.setUint32(4, 36 + len * ch * 2, true); w(8, "WAVE"); w(12, "fmt ");
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true);
  out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, len * ch * 2, true);
  const data = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, data[c]?.[i] ?? 0));
    out.setInt16(o, v * 0x7fff, true);
    o += 2;
  }
  return new Blob([out], { type: "audio/wav" });
}
