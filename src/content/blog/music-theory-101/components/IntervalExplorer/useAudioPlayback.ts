import { useEffect, useRef } from "react";
import { getContext, getTransport, start, Part, type BaseContext } from "tone";
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
      transport.cancel();

      if (activePartRef.current) {
        activePartRef.current.dispose();
        activePartRef.current = null;
      }
    };
  }, []);

  const resetTransport = () => {
    transport.stop();
    transport.cancel();
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
        keyboardRef.playNote(noteId, time);
        transport.schedule(() => {
          setPlayingNotes([]);
        }, "+0:0.5");
      },
      [{ time: 0 }]
    );

    activePartRef.current = part;
    part.start(0);
    transport.start();
    part.stop("+0:1");
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

    const part = new Part(
      (time, event) => {
        setPlayingNotes(event.notes);

        if (event.isChord && keyboardRef.playNotes) {
          keyboardRef.playNotes(event.notes);
        } else {
          event.notes.forEach((note: string) => {
            keyboardRef.playNote(note, time);
          });
        }

        if (event.isLast) {
          transport.schedule(() => {
            setPlayingNotes([]);
          }, "+0:1");
        }
      },
      [
        { time: 0, notes: [note1], isLast: false, isChord: false },
        { time: "0:1.5", notes: [note2], isLast: false, isChord: false },
        { time: "0:3", notes: [note1, note2], isLast: true, isChord: true },
      ]
    );

    activePartRef.current = part;
    part.start(0);
    transport.start();
    part.stop("+0:5");
  };

  return {
    playNote,
    playInterval,
    stopPlayback,
  };
};
