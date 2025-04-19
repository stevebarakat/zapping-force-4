import type { Note, OctaveRange } from "./types";
import { BASE_NOTES } from "./constants";

export const generateNotesForOctaveRange = (
  octaveRange: OctaveRange
): Note[] => {
  const notesArray: Note[] = [];

  for (let octave = octaveRange.min; octave <= octaveRange.max; octave++) {
    // Add all notes for the current octave
    BASE_NOTES.forEach((note) => {
      const noteId = note.name.replace("♯", "#");
      notesArray.push({
        id: `${noteId}${octave}`,
        name: note.name,
        position: note.position,
        octave: octave,
        absolutePosition: octave * 12 + note.position,
      });
    });
  }

  return notesArray;
};

export const calculateInterval = (note1: Note, note2: Note): number => {
  const semitones = Math.abs(note2.absolutePosition - note1.absolutePosition);
  return semitones % 12;
};

export const getIntervalText = (
  note1: Note,
  note2: Note,
  intervalNames: Record<number, string>
): string => {
  const semitones = Math.abs(note2.absolutePosition - note1.absolutePosition);
  const octavesApart = Math.floor(semitones / 12);
  const basicInterval = semitones % 12;

  let intervalText = intervalNames[basicInterval];

  if (octavesApart > 0) {
    intervalText += ` + ${octavesApart} octave${octavesApart > 1 ? "s" : ""}`;
  }

  return `${note1.name}${note1.octave} and ${note2.name}${note2.octave}, forming a ${intervalText}.`;
};
