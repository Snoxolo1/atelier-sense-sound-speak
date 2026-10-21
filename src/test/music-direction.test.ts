import { describe, expect, it } from "vitest";
import { clampAmapianoTempo } from "@/lib/music-direction";

describe("Amapiano tempo", () => {
  it("keeps the requested tempo between 112 and 115 BPM", () => {
    expect(clampAmapianoTempo(95)).toBe(112);
    expect(clampAmapianoTempo(113)).toBe(113);
    expect(clampAmapianoTempo(128)).toBe(115);
  });
});