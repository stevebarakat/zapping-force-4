import { useEffect, useRef } from "react";
import {
  getContext,
  getTransport,
  start,
  Part,
  type BaseContext,
  Sequence,
} from "tone";
import type { InstrumentPlayerRef } from "./types";

export const useAudioPlayback = () => {
  const transport = getTransport();
  const audioContext = useRef<BaseContext | null>(null);
  const activePartRef = useRef<Part<any> | null>(null);

  useEffect(() => {
    audioContext.current = getContext();
    const setupTone = async () => {
      try {
        if (transport) {
          transport.bpm.value = 90;
        }
      } catch (error) {
        console.error("Error setting up Tone.js:", error);
      }
    };

    setupTone();

    return () => {
      stopPlayback();
      transport.stop();
      // transport.cancel();

      if (activePartRef.current) {
        activePartRef.current.dispose();
        activePartRef.current = null;
      }
    };
  }, []);

  const resetTransport = () => {
    transport.stop();
    // transport.cancel();
    transport.position = 0;
  };

  const stopPlayback = () => {
    resetTransport();
    if (activePartRef.current) {
      activePartRef.current.dispose();
      activePartRef.current = null;
    }
  };

  const playNote = (
    keyboardRef: InstrumentPlayerRef | null,
    noteId: string,
    setPlayingNotes: (notes: string[]) => void
  ) => {
    if (!keyboardRef) return;

    setPlayingNotes([noteId]);

    if (audioContext.current?.state !== "running") {
      start();
    }

    resetTransport();

    if (activePartRef.current) {
      activePartRef.current.dispose();
      activePartRef.current = null;
    }

    const part = new Part(
      (time) => {
        keyboardRef.playNote(noteId, time + "1s");
        setPlayingNotes([noteId]);
      },
      [{ time: 0 }]
    );

    activePartRef.current = part;
    part.start(0);
    transport.start();
    part.stop("+1");
  };

  const playInterval = (
    keyboardRef: InstrumentPlayerRef | null,
    note1: string,
    note2: string,
    setPlayingNotes: (notes: string[]) => void
  ) => {
    if (!keyboardRef) return;

    setPlayingNotes([]);

    if (audioContext.current?.state !== "running") {
      start();
    }

    if (activePartRef.current) {
      activePartRef.current.dispose();
    }

    resetTransport();

    const sequence = new Sequence(
      (time, note) => {
        if (note) {
          keyboardRef.playNote(note);
          setPlayingNotes([note]);
        }
      },
      [note1, note2],
      "4n"
    );

    const sequenceRef = useRef<Sequence<string> | null>(sequence);
    sequenceRef.current = sequence;

    sequence.start(0);
    transport.start();
    sequence.stop("+2");

    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
    };
  };

  return {
    playNote,
    playInterval,
    stopPlayback,
  };
};
