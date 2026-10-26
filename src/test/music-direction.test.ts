import { describe, expect, it } from "vitest";
import { BPM_RANGES, MUSIC_GENRES, clampAmapianoTempo, clampTempoFor } from "@/lib/music-direction";
import { DEFAULT_LAYERS, DEFAULT_SECTIONS, SOUND_CHOICES } from "@/lib/synth";

describe("Amapiano tempo", () => {
  it("keeps the requested tempo between 112 and 115 BPM", () => {
    expect(clampAmapianoTempo(95)).toBe(112);
    expect(clampAmapianoTempo(113)).toBe(113);
    expect(clampAmapianoTempo(128)).toBe(115);
  });
});

describe("Genre tempo ranges", () => {
  it("clamps each genre to its own tempo range", () => {
    expect(clampTempoFor("hiphop", 140)).toBe(BPM_RANGES.hiphop.max);
    expect(clampTempoFor("rnb", 60)).toBe(BPM_RANGES.rnb.min);
    expect(clampTempoFor("jazz", 120)).toBe(120);
    expect(clampTempoFor("hiphop", Number.NaN)).toBe(BPM_RANGES.hiphop.default);
  });
});

describe("Music studio choices", () => {
  it("offers the four requested genres", () => {
    expect(MUSIC_GENRES).toEqual(expect.arrayContaining(["amapiano", "jazz", "rnb", "hiphop"]));
  });
  it("defaults every layer and arrangement section on so they can be toggled off", () => {
    expect(DEFAULT_LAYERS).toEqual({ drums: true, melody: true, bass: true });
    expect(DEFAULT_SECTIONS).toEqual({ buildup: true, drop: true, transition: true });
    expect(SOUND_CHOICES).toContain("piano");
  });
});
