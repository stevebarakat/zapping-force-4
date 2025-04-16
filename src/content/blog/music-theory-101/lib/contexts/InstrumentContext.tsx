import React, { createContext, useCallback, useState } from "react";
import * as Tone from "tone";
import { INSTRUMENTS } from "../instruments";

interface InstrumentContextType {
  currentInstrument: string;
  isLoading: boolean;
  error: Error | null;
  loadInstrument: (name: string) => Promise<void>;
  playNote: (note: string) => void;
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

  const loadInstrument = useCallback(
    async (instrumentName: string) => {
      try {
        setIsLoading(true);
        setError(null);
        setIsSamplerReady(false);

        const instrument = INSTRUMENTS.find((i) => i.name === instrumentName);
        if (!instrument)
          throw new Error(`Instrument ${instrumentName} not found`);

        // Create URLs for all notes
        const urls: Record<string, string> = {};
        for (const note of instrument.notes) {
          const mappedNote = note.replace("#", "s");
          urls[note] = `${instrument.url}/${mappedNote}.ogg`;
        }

        if (sampler) {
          sampler.dispose();
        }

        const newSampler = new Tone.Sampler({
          urls,
          onerror: (error) => {
            console.error(`Failed to load ${instrumentName}:`, error);
            setError(
              error instanceof Error
                ? error
                : new Error("Failed to load instrument")
            );
            setIsLoading(false);
            setIsSamplerReady(false);
          },
          onload: () => {
            console.log(`${instrumentName} loaded successfully`);
            setIsLoading(false);
            setIsSamplerReady(true);
          },
          release: 1,
          attack: 0,
          curve: "linear",
          volume: 0,
        }).toDestination();

        setSampler(newSampler);
        setCurrentInstrument(instrumentName);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load instrument")
        );
        setIsLoading(false);
        setIsSamplerReady(false);
      }
    },
    [sampler]
  );

  const playNote = useCallback(
    (note: string) => {
      if (!sampler || !isAudioInitialized || !isSamplerReady) {
        console.warn("Cannot play note: sampler not ready");
        return;
      }
      try {
        sampler.triggerAttack(note);
      } catch (e) {
        console.error("Error playing note:", e);
      }
    },
    [sampler, isAudioInitialized, isSamplerReady]
  );

  const stopNote = useCallback(
    (note: string) => {
      if (!sampler || !isAudioInitialized || !isSamplerReady) return;
      sampler.triggerRelease(note);
    },
    [sampler, isAudioInitialized, isSamplerReady]
  );

  const stopAllNotes = useCallback(() => {
    if (!sampler || !isAudioInitialized || !isSamplerReady) return;
    sampler.releaseAll();
  }, [sampler, isAudioInitialized, isSamplerReady]);

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
