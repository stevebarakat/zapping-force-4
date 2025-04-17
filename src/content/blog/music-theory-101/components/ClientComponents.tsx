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
import { audioCoordinator } from "../utils/audioCoordinator";
import { initializeAudio } from "../utils/audioInitialization";

// Intersection observer wrapper for components
const IntersectionWrapper = ({
  Component,
  id,
}: {
  Component: React.ComponentType;
  id: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.3,
        rootMargin: "200px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  // Handle audio initialization on user interaction
  useEffect(() => {
    const handleInteraction = async () => {
      if (isVisible) {
        await initializeAudio();
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [isVisible]);

  return (
    <div
      ref={ref}
      style={{
        minHeight: "300px",
        position: "relative",
      }}
    >
      {isVisible && <Component />}
    </div>
  );
};

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

export const ClientTimeSignatureExplorer = () => (
  <IntersectionWrapper
    Component={TimeSignatureExplorer}
    id="time-signature-explorer"
  />
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
