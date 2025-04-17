import { getContext, start } from "tone";

let isAudioInitialized = false;

export const initializeAudio = async () => {
  if (isAudioInitialized) return;

  try {
    const context = getContext();
    if (context.state !== "running") {
      await start();
    }
    isAudioInitialized = true;
  } catch (error) {
    console.error("Error initializing audio:", error);
  }
};

export const resetAudioInitialization = () => {
  isAudioInitialized = false;
};
