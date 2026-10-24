export const ANIMAL_CLASSES = new Set([
  "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe",
]);

export const VEHICLE_CLASSES = new Set([
  "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
]);

export type VisionCategory = "human" | "animal" | "vehicle" | "object";

export function categorize(cls: string): VisionCategory {
  if (cls === "person") return "human";
  if (ANIMAL_CLASSES.has(cls)) return "animal";
  if (VEHICLE_CLASSES.has(cls)) return "vehicle";
  return "object";
}

export function personLabel(n: number): string {
  return n === 1 ? "1 person" : `${n} people`;
}

export type VoiceEstimate = "male" | "female" | "unclear";

/**
 * Best-effort voice estimate from median fundamental frequency.
 * Typical adult male speech is roughly 85–155 Hz, female 165–255 Hz.
 */
export function classifyVoice(medianPitch: number): VoiceEstimate {
  if (medianPitch <= 0) return "unclear";
  if (medianPitch >= 165) return "female";
  if (medianPitch <= 145) return "male";
  return "unclear";
}

/** Returns the dominant pitch in Hz, or -1 when the buffer is too quiet. */
export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const size = buf.length;
  if (size === 0) return -1;
  let rms = 0;
  for (let i = 0; i < size; i++) {
    const v = buf[i] ?? 0;
    rms += v * v;
  }
  if (Math.sqrt(rms / size) < 0.008) return -1;

  const minLag = Math.max(2, Math.floor(sampleRate / 350));
  const maxLag = Math.min(size - 1, Math.floor(sampleRate / 70));
  if (maxLag <= minLag) return -1;

  const corr = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < size; i++) sum += (buf[i] ?? 0) * (buf[i + lag] ?? 0);
    corr[lag] = sum;
  }
  let bestLag = minLag;
  let bestVal = corr[minLag] ?? 0;
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    const v = corr[lag] ?? 0;
    if (v > bestVal) {
      bestVal = v;
      bestLag = lag;
    }
  }
  if (bestVal <= 0) return -1;

  const x1 = corr[bestLag - 1] ?? bestVal;
  const x3 = corr[bestLag + 1] ?? bestVal;
  const a = (x1 + x3 - 2 * bestVal) / 2;
  const b = (x3 - x1) / 2;
  const refined = a !== 0 ? bestLag - b / (2 * a) : bestLag;
  return sampleRate / refined;
}
