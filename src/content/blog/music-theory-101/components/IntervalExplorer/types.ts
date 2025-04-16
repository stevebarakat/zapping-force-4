export interface Note {
  id: string;
  name: string;
  position: number;
  octave: number;
  absolutePosition: number; // Position across all octaves
}

export interface IntervalQuality {
  quality: string;
  emotion: string;
  ratio: string;
}

export interface InstrumentPlayerRef {
  playNote: (noteId: string, time?: number | string) => void;
  playNotes: (noteIds: string[]) => void;
  stopNote: (noteId: string) => void;
  isNoteAvailable?: (note: string) => boolean;
}

export interface OctaveRange {
  min: number;
  max: number;
}
