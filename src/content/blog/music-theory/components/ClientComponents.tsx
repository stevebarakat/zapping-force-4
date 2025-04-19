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
import { addAudioInitializationListener } from "../utils/audioInitializer";

// Intersection observer wrapper for components
const IntersectionWrapper = ({
  Component,
  id,
}: {
  Component: React.ComponentType;
  id: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (!entry.isIntersecting) {
          // When component goes off screen, increment the key to force a re-render
          setKey((prev) => prev + 1);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "300px",
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

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        minHeight: "1px",
      }}
    >
      {isVisible && <Component key={key} />}
    </div>
  );
};

// Add audio initialization listener when the component mounts
const AudioInitializer = () => {
  useEffect(() => {
    addAudioInitializationListener();
  }, []);
  return null;
};

export const ClientScalePlayer = () => (
  <>
    <AudioInitializer />
    <IntersectionWrapper
      Component={() => (
        <InstrumentProvider>
          <ScalePlayer />
        </InstrumentProvider>
      )}
      id="scale-player"
    />
  </>
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
