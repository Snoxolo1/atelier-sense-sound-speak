export const AMAPIANO_TEMPO = { min: 112, max: 115, default: 113 } as const;

export function clampAmapianoTempo(value: number) {
  if (!Number.isFinite(value)) return AMAPIANO_TEMPO.default;
  return Math.min(AMAPIANO_TEMPO.max, Math.max(AMAPIANO_TEMPO.min, Math.round(value)));
}