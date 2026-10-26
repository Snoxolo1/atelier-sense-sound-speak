export type Genre = "amapiano" | "jazz" | "rnb" | "hiphop" | "afrobeat" | "lofi";

export const MUSIC_GENRES: Genre[] = ["amapiano", "jazz", "rnb", "hiphop"];

export const AMAPIANO_TEMPO = { min: 112, max: 115, default: 113 } as const;

export const BPM_RANGES: Record<Genre, { min: number; max: number; default: number }> = {
  amapiano: AMAPIANO_TEMPO,
  jazz: { min: 90, max: 150, default: 120 },
  rnb: { min: 70, max: 105, default: 92 },
  hiphop: { min: 80, max: 100, default: 90 },
  afrobeat: { min: 98, max: 116, default: 105 },
  lofi: { min: 70, max: 95, default: 82 },
};

export function clampTempoFor(genre: Genre, value: number) {
  const range = BPM_RANGES[genre];
  if (!Number.isFinite(value)) return range.default;
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

export function clampAmapianoTempo(value: number) {
  return clampTempoFor("amapiano", value);
}
