import React, { useState, useEffect } from "react";
import { AmplitudeDemo } from "./AmplitudeDemo";
import { FrequencyDemo } from "./FrequencyDemo";
import { HarmonicsExplorer } from "./HarmonicsExplorer";
import { ResonanceDemo } from "./ResonanceDemo";
import { SoundSpectrumAnalyzer } from "./SoundSpectrumAnalyzer";
import { StandingWavesDemo } from "./StandingWavesDemo";
import { WaveVisualizer } from "./WaveVisualizer";
import "@/content/blog/sound-basics-mdx-post/components/shared/dark-mode.css";

const ClientWrapper = ({ Component }: { Component: React.ComponentType }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <Component />;
};

export const ClientAmplitudeDemo = () => (
  <ClientWrapper Component={AmplitudeDemo} />
);

export const ClientFrequencyDemo = () => (
  <ClientWrapper Component={FrequencyDemo} />
);

export const ClientHarmonicsExplorer = () => (
  <ClientWrapper Component={HarmonicsExplorer} />
);

export const ClientResonanceDemo = () => (
  <ClientWrapper Component={ResonanceDemo} />
);

export const ClientSoundSpectrumAnalyzer = () => (
  <ClientWrapper Component={SoundSpectrumAnalyzer} />
);

export const ClientStandingWavesDemo = () => (
  <ClientWrapper Component={StandingWavesDemo} />
);

export const ClientWaveVisualizer = () => (
  <ClientWrapper Component={WaveVisualizer} />
);
