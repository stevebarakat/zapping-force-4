export type Note = {
  name: string;
  octave: number;
  isSharp: boolean;
};

export function parseNote(noteStr: string): Note {
  const match = noteStr.match(/([A-G]#?)(\d+)/);
  if (!match) throw new Error(`Invalid note format: ${noteStr}`);

  const [, name, octave] = match;
  return {
    name,
    octave: parseInt(octave),
    isSharp: name.includes("#"),
  };
}

export function getNoteRange(octaves: { [key: number]: string[] | "all" }): {
  minOctave: number;
  maxOctave: number;
} {
  const octaveNumbers = Object.keys(octaves).map(Number);
  return {
    minOctave: Math.min(...octaveNumbers),
    maxOctave: Math.max(...octaveNumbers),
  };
}

export function generateAllNotes(
  minOctave: number,
  maxOctave: number
): string[] {
  const notes: string[] = [];
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  for (let octave = minOctave; octave <= maxOctave; octave++) {
    for (const noteName of noteNames) {
      notes.push(`${noteName}${octave}`);
    }
  }

  return notes;
}

export function isNoteAvailable(
  note: string,
  octaves: { [key: number]: string[] | "all" }
): boolean {
  const { octave } = parseNote(note);
  const octaveConfig = octaves[octave];

  if (!octaveConfig) return false;
  if (octaveConfig === "all") return true;

  return octaveConfig.includes(note);
}
