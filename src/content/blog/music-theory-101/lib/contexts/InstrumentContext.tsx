import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import * as Tone from "tone";
import { INSTRUMENT_TYPES } from "@/consts";
import { initializeAudio } from "../../utils/audioInitialization";

interface InstrumentContextType {
  currentInstrument: string;
  isLoading: boolean;
  error: Error | null;
  loadInstrument: (instrumentType: string) => Promise<void>;
  playNote: (note: string) => void;
  stopNote: (note: string) => void;
  initializeAudio: () => Promise<void>;
  isAudioInitialized: boolean;
  isSamplerReady: boolean;
}

const InstrumentContext = createContext<InstrumentContextType | null>(null);

export const InstrumentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentInstrument, setCurrentInstrument] = useState<string>(
    INSTRUMENT_TYPES.PIANO
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [isSamplerReady, setIsSamplerReady] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  const initializeAudioContext = async () => {
    if (isAudioInitialized) return;
    try {
      await initializeAudio();
      setIsAudioInitialized(true);
    } catch (error) {
      console.error("Error initializing audio context:", error);
      setError(error as Error);
    }
  };

  const loadInstrument = async (instrumentType: string) => {
    if (instrumentType === currentInstrument && samplerRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      if (samplerRef.current) {
        samplerRef.current.dispose();
      }

      const baseUrl = "/audio/piano-mp3/";
      const urls = {
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
      };

      samplerRef.current = new Tone.Sampler({
        urls,
        baseUrl,
        onload: () => {
          setIsLoading(false);
          setIsSamplerReady(true);
        },
        onerror: (error) => {
          console.error("Error loading sampler:", error);
          setError(error);
          setIsLoading(false);
        },
      }).toDestination();

      setCurrentInstrument(instrumentType);
    } catch (error) {
      console.error("Error loading instrument:", error);
      setError(error as Error);
      setIsLoading(false);
    }
  };

  const playNote = (note: string) => {
    if (!isAudioInitialized || !isSamplerReady || !samplerRef.current) {
      console.warn("Cannot play note: audio not ready");
      return;
    }

    try {
      samplerRef.current.triggerAttack(note);
    } catch (error) {
      console.error("Error playing note:", error);
    }
  };

  const stopNote = (note: string) => {
    if (!isAudioInitialized || !isSamplerReady || !samplerRef.current) return;

    try {
      samplerRef.current.triggerRelease(note);
    } catch (error) {
      console.error("Error stopping note:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (samplerRef.current) {
        samplerRef.current.dispose();
      }
    };
  }, []);

  return (
    <InstrumentContext.Provider
      value={{
        currentInstrument,
        isLoading,
        error,
        loadInstrument,
        playNote,
        stopNote,
        initializeAudio: initializeAudioContext,
        isAudioInitialized,
        isSamplerReady,
      }}
    >
      {children}
    </InstrumentContext.Provider>
  );
};

export const useInstrument = () => {
  const context = useContext(InstrumentContext);
  if (!context) {
    throw new Error("useInstrument must be used within an InstrumentProvider");
  }
  return context;
};
