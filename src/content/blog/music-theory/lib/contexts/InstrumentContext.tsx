import React, { createContext, useCallback, useState } from "react";
import * as Tone from "tone";
import { INSTRUMENTS } from "../instruments";

interface InstrumentContextType {
  currentInstrument: string;
  isLoading: boolean;
  error: Error | null;
  loadInstrument: (name: string) => Promise<void>;
  playNote: (note: string, duration?: string) => void;
  stopNote: (note: string) => void;
  stopAllNotes: () => void;
  instruments: typeof INSTRUMENTS;
  initializeAudio: () => Promise<void>;
  isAudioInitialized: boolean;
  isSamplerReady: boolean;
}

const InstrumentContext = createContext<InstrumentContextType | null>(null);

export function InstrumentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [currentInstrument, setCurrentInstrument] = useState("piano");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isSamplerReady, setIsSamplerReady] = useState(false);

  const initializeAudio = useCallback(async () => {
    if (isAudioInitialized) return;

    try {
      await Tone.start();
      setIsAudioInitialized(true);
      await loadInstrument("piano");
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to initialize audio")
      );
    }
  }, [isAudioInitialized]);

  const loadInstrument = useCallback(async (name: string) => {
    if (name !== "piano") {
      console.warn("Only piano is supported");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const piano = INSTRUMENTS.find((i) => i.name === "piano");
      if (!piano) {
        throw new Error("Piano instrument not found");
      }

      const newSampler = new Tone.Sampler({
        urls: {
          A0: "A0.mp3",
          C1: "C1.mp3",
          "D#1": "Ds1.mp3",
          "F#1": "Fs1.mp3",
          A1: "A1.mp3",
          C2: "C2.mp3",
          "D#2": "Ds2.mp3",
          "F#2": "Fs2.mp3",
          A2: "A2.mp3",
          C3: "C3.mp3",
          "D#3": "Ds3.mp3",
          "F#3": "Fs3.mp3",
          A3: "A3.mp3",
          C4: "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          A4: "A4.mp3",
          C5: "C5.mp3",
          "D#5": "Ds5.mp3",
          "F#5": "Fs5.mp3",
          A5: "A5.mp3",
          C6: "C6.mp3",
          "D#6": "Ds6.mp3",
          "F#6": "Fs6.mp3",
          A6: "A6.mp3",
          C7: "C7.mp3",
        },
        baseUrl: piano.url,
        onload: () => {
          setIsSamplerReady(true);
          setIsLoading(false);
        },
        onerror: (err) => {
          setError(new Error(`Failed to load piano samples: ${err}`));
          setIsLoading(false);
        },
        release: 1,
        attack: 0,
        curve: "linear",
        volume: 0,
      }).toDestination();

      setSampler(newSampler);
      setCurrentInstrument("piano");
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load piano samples")
      );
      setIsLoading(false);
    }
  }, []);

  const playNote = useCallback(
    (note: string, duration?: string) => {
      if (!sampler || !isSamplerReady) {
        console.warn("Cannot play note: sampler not ready");
        return;
      }

      try {
        sampler.triggerAttack(note);
        if (duration) {
          sampler.triggerRelease(
            note,
            Tone.now() + Tone.Time(duration).toSeconds()
          );
        }
      } catch (err) {
        console.error("Error playing note:", err);
      }
    },
    [sampler, isSamplerReady]
  );

  const stopNote = useCallback(
    (note: string) => {
      if (!sampler || !isSamplerReady) {
        return;
      }

      try {
        sampler.triggerRelease(note);
      } catch (err) {
        console.error("Error stopping note:", err);
      }
    },
    [sampler, isSamplerReady]
  );

  const stopAllNotes = useCallback(() => {
    if (!sampler || !isSamplerReady) {
      return;
    }

    try {
      sampler.releaseAll();
    } catch (err) {
      console.error("Error stopping all notes:", err);
    }
  }, [sampler, isSamplerReady]);

  return (
    <InstrumentContext.Provider
      value={{
        currentInstrument,
        isLoading,
        error,
        loadInstrument,
        playNote,
        stopNote,
        stopAllNotes,
        instruments: INSTRUMENTS,
        initializeAudio,
        isAudioInitialized,
        isSamplerReady,
      }}
    >
      {children}
    </InstrumentContext.Provider>
  );
}

export default InstrumentContext;
