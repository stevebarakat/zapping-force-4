import { useState, useEffect } from "react";
import SimpleOscillator from "./SimpleOscillator";
import WaveformExplorer from "./WaveformExplorer";
import DualOscillator from "./DualOscillator";
import ADSRVisualizer from "./ADSRVisualizer";
import FilterDemo from "./FilterDemo/FilterDemo";
import LFODemo from "./LFODemo";
import CompleteSynth from "./CompleteSynth";

function ClientWrapper({ Component }: { Component: React.ComponentType }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? <Component /> : null;
}

export const ClientSimpleOscillator = () => (
  <ClientWrapper Component={SimpleOscillator} />
);
export const ClientWaveformExplorer = () => (
  <ClientWrapper Component={WaveformExplorer} />
);
export const ClientDualOscillator = () => (
  <ClientWrapper Component={DualOscillator} />
);
export const ClientADSRVisualizer = () => (
  <ClientWrapper Component={ADSRVisualizer} />
);
export const ClientFilterDemo = () => <ClientWrapper Component={FilterDemo} />;
export const ClientLFODemo = () => <ClientWrapper Component={LFODemo} />;
export const ClientCompleteSynth = () => (
  <ClientWrapper Component={CompleteSynth} />
);
