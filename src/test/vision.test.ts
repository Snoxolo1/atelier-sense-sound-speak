import { describe, expect, it } from "vitest";
import { autoCorrelate, categorize, classifyVoice, personLabel } from "@/lib/vision";

describe("vision categories", () => {
  it("separates a single person from multiple people", () => {
    expect(personLabel(1)).toBe("1 person");
    expect(personLabel(4)).toBe("4 people");
  });

  it("sorts detections into humans, animals, vehicles and objects", () => {
    expect(categorize("person")).toBe("human");
    expect(categorize("dog")).toBe("animal");
    expect(categorize("horse")).toBe("animal");
    expect(categorize("car")).toBe("vehicle");
    expect(categorize("bus")).toBe("vehicle");
    expect(categorize("backpack")).toBe("object");
    expect(categorize("cell phone")).toBe("object");
  });
});

describe("voice estimate", () => {
  it("classifies typical male, female and unclear pitch ranges", () => {
    expect(classifyVoice(110)).toBe("male");
    expect(classifyVoice(145)).toBe("male");
    expect(classifyVoice(220)).toBe("female");
    expect(classifyVoice(165)).toBe("female");
    expect(classifyVoice(155)).toBe("unclear");
    expect(classifyVoice(0)).toBe("unclear");
  });
});

describe("pitch detection", () => {
  const sampleRate = 44100;
  function sine(freq: number, seconds = 0.05, amplitude = 0.4) {
    const n = Math.floor(sampleRate * seconds);
    const buf = new Float32Array(n);
    for (let i = 0; i < n; i++) buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
    return buf;
  }

  it("finds the fundamental frequency of a sine wave", () => {
    expect(Math.abs(autoCorrelate(sine(110), sampleRate) - 110)).toBeLessThan(5);
    expect(Math.abs(autoCorrelate(sine(220), sampleRate) - 220)).toBeLessThan(6);
  });

  it("reports no pitch for silence", () => {
    expect(autoCorrelate(new Float32Array(2048), sampleRate)).toBe(-1);
  });
});
