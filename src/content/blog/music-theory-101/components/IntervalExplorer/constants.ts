import { INSTRUMENT_TYPES } from "@/consts";
import type { IntervalQuality } from "./types";

export const DEFAULT_OCTAVE_RANGE = { min: 3, max: 5 };

export const BASE_NOTES = [
  { name: "C", position: 0 },
  { name: "C♯", position: 1 },
  { name: "D", position: 2 },
  { name: "D♯", position: 3 },
  { name: "E", position: 4 },
  { name: "F", position: 5 },
  { name: "F♯", position: 6 },
  { name: "G", position: 7 },
  { name: "G♯", position: 8 },
  { name: "A", position: 9 },
  { name: "A♯", position: 10 },
  { name: "B", position: 11 },
];

export const INTERVAL_NAMES: Record<number, string> = {
  0: "Unison",
  1: "Minor 2nd",
  2: "Major 2nd",
  3: "Minor 3rd",
  4: "Major 3rd",
  5: "Perfect 4th",
  6: "Tritone",
  7: "Perfect 5th",
  8: "Minor 6th",
  9: "Major 6th",
  10: "Minor 7th",
  11: "Major 7th",
  12: "Octave",
};

export const INTERVAL_QUALITIES: Record<number, IntervalQuality> = {
  0: { quality: "Perfect", emotion: "Stable, pure", ratio: "1:1" },
  1: { quality: "Dissonant", emotion: "Tense, unstable", ratio: "16:15" },
  2: { quality: "Dissonant", emotion: "Bright, whole step", ratio: "9:8" },
  3: { quality: "Consonant", emotion: "Soft, melancholic", ratio: "6:5" },
  4: { quality: "Consonant", emotion: "Bright, happy", ratio: "5:4" },
  5: { quality: "Perfect", emotion: "Open, stable", ratio: "4:3" },
  6: { quality: "Dissonant", emotion: "Tense, unstable", ratio: "45:32" },
  7: { quality: "Perfect", emotion: "Strong, stable", ratio: "3:2" },
  8: { quality: "Consonant", emotion: "Soft, sweet", ratio: "8:5" },
  9: { quality: "Consonant", emotion: "Bright, sweet", ratio: "5:3" },
  10: { quality: "Dissonant", emotion: "Tense, anticipatory", ratio: "16:9" },
  11: { quality: "Dissonant", emotion: "Leading, tense", ratio: "15:8" },
  12: { quality: "Perfect", emotion: "Complete, stable", ratio: "2:1" },
};
