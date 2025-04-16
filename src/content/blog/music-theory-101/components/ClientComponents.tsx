import { useState, useEffect, useRef } from "react";
import TimeSignatureExplorer from "./TimeSignatureExplorer";
import ChordExplorer from "./ChordExplorer";
import ChordProgressionPlayer from "./ChordProgressionPlayer";
import FrequencyVisualizer from "./FrequencyVisualizer";
import IntervalExplorer from "./IntervalExplorer";
import KeySignatureExplorer from "./KeySignatureExplorer";
import MusicAnalyzer from "./MusicAnalyzer";
import RhythmSequencer from "./RhythmSequencer";
import ScalePlayer from "./ScalePlayer";
import NotePlayer from "./NotePlayer/NotePlayer";
import { InstrumentProvider } from "../lib/contexts/InstrumentContext";

// Audio coordinator to manage global audio state
export const audioCoordinator = {
  activeComponents: new Set<string>(),

  registerComponent(id: string) {
    this.activeComponents.add(id);
    console.log(
      `Component ${id} registered. Active components:`,
      Array.from(this.activeComponents)
    );
  },

  unregisterComponent(id: string) {
    this.activeComponents.delete(id);
    console.log(
      `Component ${id} unregistered. Active components:`,
      Array.from(this.activeComponents)
    );
  },

  isComponentActive(id: string) {
    return this.activeComponents.has(id);
  },
};

const IntersectionWrapper = ({
  Component,
  id,
}: {
  Component: React.ComponentType;
  id: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }

        // Add a small delay before updating visibility to prevent rapid toggling
        timeoutRef.current = window.setTimeout(() => {
          setIsVisible(entry.isIntersecting);
        }, 100);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100px",
        position: "relative",
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? "visible" : "hidden",
        transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
        willChange: "opacity",
      }}
    >
      <Component />
    </div>
  );
};

export const ClientTimeSignatureExplorer = () => (
  <IntersectionWrapper
    Component={TimeSignatureExplorer}
    id="time-signature-explorer"
  />
);

export const ClientScalePlayer = () => (
  <IntersectionWrapper
    Component={() => (
      <InstrumentProvider>
        <ScalePlayer />
      </InstrumentProvider>
    )}
    id="scale-player"
  />
);

export const ClientRhythmSequencer = () => (
  <IntersectionWrapper Component={RhythmSequencer} id="rhythm-sequencer" />
);

export const ClientPianoKeyboard = () => (
  <IntersectionWrapper
    Component={() => (
      <InstrumentProvider>
        <NotePlayer />
      </InstrumentProvider>
    )}
    id="piano-keyboard"
  />
);

export const ClientMusicAnalyzer = () => (
  <IntersectionWrapper Component={MusicAnalyzer} id="music-analyzer" />
);

export const ClientKeySignatureExplorer = () => (
  <IntersectionWrapper
    Component={KeySignatureExplorer}
    id="key-signature-explorer"
  />
);

export const ClientIntervalDemo = () => (
  <IntersectionWrapper
    Component={() => (
      <InstrumentProvider>
        <IntervalExplorer />
      </InstrumentProvider>
    )}
    id="interval-demo"
  />
);

export const ClientFrequencyVisualizer = () => (
  <IntersectionWrapper
    Component={FrequencyVisualizer}
    id="frequency-visualizer"
  />
);

export const ClientChordProgressionPlayer = () => (
  <IntersectionWrapper
    Component={() => (
      <InstrumentProvider>
        <ChordProgressionPlayer />
      </InstrumentProvider>
    )}
    id="chord-progression-player"
  />
);

export const ClientChordExplorer = () => (
  <IntersectionWrapper
    Component={() => (
      <InstrumentProvider>
        <ChordExplorer />
      </InstrumentProvider>
    )}
    id="chord-explorer"
  />
);

export const ClientNotePlayer = () => (
  <IntersectionWrapper
    Component={() => (
      <InstrumentProvider>
        <NotePlayer />
      </InstrumentProvider>
    )}
    id="note-player"
  />
);
