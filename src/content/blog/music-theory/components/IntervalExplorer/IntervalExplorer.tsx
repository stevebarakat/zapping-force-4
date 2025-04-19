import React, { useState, useRef, type RefObject, useMemo } from "react";
import VisuallyHidden from "@/components/VisuallyHidden";
import { InstrumentPlayer } from "../shared/InstrumentPlayer";
import { INSTRUMENT_TYPES } from "@/consts";
import "@/styles/shared/dark-mode.css";
import { Callout } from "@/components/Callout";
import { Button } from "@/components/Button";
import type { Note, InstrumentPlayerRef, OctaveRange } from "./types";
import {
  DEFAULT_OCTAVE_RANGE,
  INTERVAL_NAMES,
  INTERVAL_QUALITIES,
} from "./constants";
import {
  generateNotesForOctaveRange,
  calculateInterval,
  getIntervalText,
} from "./noteUtils";
import { useAudioPlayback } from "./useAudioPlayback";

// UI Components
const Controls: React.FC<{
  onClear: () => void;
  onPlayInterval: () => void;
  isIntervalComplete: boolean;
}> = ({ onClear, onPlayInterval, isIntervalComplete }) => (
  <div className="flex start gap-2">
    <Button onClick={onClear} variant="outline">
      Clear Selection
    </Button>
    <Button onClick={onPlayInterval} disabled={!isIntervalComplete}>
      Play Interval
    </Button>
  </div>
);

const IntervalDetails: React.FC<{
  interval: number;
  firstNote: Note;
  secondNote: Note;
}> = ({ interval, firstNote, secondNote }) => (
  <div className="interval-details">
    <div className="interval-grid">
      <div className="interval-grid-item">
        <span className="interval-label">Quality:</span>
        {INTERVAL_QUALITIES[interval].quality}
      </div>
      <div className="interval-grid-item">
        <span className="interval-label">Frequency Ratio:</span>
        {INTERVAL_QUALITIES[interval].ratio}
      </div>
      <div className="interval-grid-item">
        <span className="interval-label">Emotional Quality:</span>
        {INTERVAL_QUALITIES[interval].emotion}
      </div>
      <div className="interval-grid-item">
        <span className="interval-label">Semitones:</span>
        {Math.abs(secondNote.absolutePosition - firstNote.absolutePosition)}
      </div>
    </div>
  </div>
);

// Custom hook for interval state management
const useIntervalState = (keyboardRef: RefObject<InstrumentPlayerRef>) => {
  const [firstNote, setFirstNote] = useState<Note | null>(null);
  const [secondNote, setSecondNote] = useState<Note | null>(null);
  const [interval, setInterval] = useState<number | null>(null);
  const [playingNotes, setPlayingNotes] = useState<string[]>([]);
  const { playNote, stopPlayback } = useAudioPlayback();
  const timeoutRef = useRef<number | null>(null);

  const handleKeyClick = (noteId: string, notes: Note[]) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopPlayback();

    if (!firstNote) {
      setFirstNote(note);
      setSecondNote(null);
      setInterval(null);
      playNote(keyboardRef.current, noteId, setPlayingNotes);
    } else if (firstNote && !secondNote) {
      setSecondNote(note);
      const newInterval = calculateInterval(firstNote, note);
      setInterval(newInterval);

      // Play the second note immediately
      playNote(keyboardRef.current, noteId, setPlayingNotes);

      // Play both notes together after 1 second
      timeoutRef.current = window.setTimeout(() => {
        if (keyboardRef.current?.playNotes) {
          keyboardRef.current.playNotes([firstNote.id, noteId]);
          setPlayingNotes([firstNote.id, noteId]);
        }
        timeoutRef.current = null;
      }, 1000);
    } else {
      setFirstNote(note);
      setSecondNote(null);
      setInterval(null);
      playNote(keyboardRef.current, noteId, setPlayingNotes);
    }
  };

  const handleClear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFirstNote(null);
    setSecondNote(null);
    setInterval(null);
    setPlayingNotes([]);
    stopPlayback();
  };

  const handlePlayInterval = () => {
    if (firstNote && secondNote && keyboardRef.current?.playNotes) {
      stopPlayback();
      keyboardRef.current.playNotes([firstNote.id, secondNote.id]);
      setPlayingNotes([firstNote.id, secondNote.id]);
    }
  };

  return {
    firstNote,
    secondNote,
    interval,
    playingNotes,
    handleKeyClick,
    handleClear,
    handlePlayInterval,
  };
};

const IntervalExplorer: React.FC = () => {
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENT_TYPES.PIANO
  );
  const [octaveRange, setOctaveRange] =
    useState<OctaveRange>(DEFAULT_OCTAVE_RANGE);
  const keyboardRef = useRef<InstrumentPlayerRef>(null);

  const {
    firstNote,
    secondNote,
    interval,
    playingNotes,
    handleKeyClick,
    handleClear,
    handlePlayInterval,
  } = useIntervalState(keyboardRef as RefObject<InstrumentPlayerRef>);

  // Memoize notes generation
  const notes = useMemo(
    () => generateNotesForOctaveRange(octaveRange),
    [octaveRange]
  );

  // Get keyboard state
  const { activeKeys, highlightedKeys } = useMemo(() => {
    const activeKeys: string[] = [];
    if (firstNote) activeKeys.push(firstNote.id);
    if (secondNote) activeKeys.push(secondNote.id);
    return { activeKeys, highlightedKeys: playingNotes };
  }, [firstNote, secondNote, playingNotes]);

  return (
    <>
      <div className="demo-container">
        <VisuallyHidden as="h3">Interval Explorer</VisuallyHidden>
        <InstrumentPlayer
          ref={keyboardRef as RefObject<InstrumentPlayerRef>}
          instrumentType={selectedInstrument}
          octaveRange={octaveRange}
          activeKeys={activeKeys}
          showLabels={true}
          onKeyClick={(noteId) => handleKeyClick(noteId, notes)}
          highlightedKeys={highlightedKeys}
          onInstrumentChange={(instrument) => {
            setSelectedInstrument(instrument);
            // The InstrumentPlayer will automatically update the octave range
            // based on the selected instrument's available range
          }}
          onOctaveRangeChange={(newRange) => setOctaveRange(newRange)}
        />
        {firstNote && secondNote && (
          <Controls
            onClear={handleClear}
            onPlayInterval={handlePlayInterval}
            isIntervalComplete={!!(firstNote && secondNote)}
          />
        )}
      </div>
      {interval !== null && firstNote && secondNote && (
        <Callout type="info" title={INTERVAL_NAMES[interval]}>
          <IntervalDetails
            interval={interval}
            firstNote={firstNote}
            secondNote={secondNote}
          />
        </Callout>
      )}
      <Callout type="instructions" title="Explore Intervals">
        {!firstNote
          ? "Select a first note on the keyboard above."
          : !secondNote
          ? "Now select a second note to form an interval."
          : getIntervalText(firstNote, secondNote, INTERVAL_NAMES)}
      </Callout>
    </>
  );
};

export default IntervalExplorer;
