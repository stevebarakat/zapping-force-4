export type InstrumentConfig = {
  name: string;
  url: string;
  octaves: { [key: number]: string[] | "all" };
  notes: string[];
};

export const INSTRUMENTS: InstrumentConfig[] = [
  {
    name: "piano",
    url: "https://tonejs.github.io/audio/salamander/",
    octaves: {
      0: ["A"],
      1: "all",
      2: "all",
      3: "all",
      4: "all",
      5: "all",
      6: "all",
      7: ["C"],
    },
    notes: [
      "A0",
      "C1",
      "D#1",
      "F#1",
      "A1",
      "C2",
      "D#2",
      "F#2",
      "A2",
      "C3",
      "D#3",
      "F#3",
      "A3",
      "C4",
      "D#4",
      "F#4",
      "A4",
      "C5",
      "D#5",
      "F#5",
      "A5",
      "C6",
      "D#6",
      "F#6",
      "A6",
      "C7",
    ],
  },
];
