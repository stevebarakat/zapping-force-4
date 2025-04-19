import * as Tone from "tone";

let isInitialized = false;

export const initializeAudio = async () => {
  if (!isInitialized) {
    await Tone.start();
    isInitialized = true;
  }
};

export const addAudioInitializationListener = () => {
  // Only add the listener if we're in the browser
  if (typeof window !== "undefined") {
    const handleClick = async () => {
      await initializeAudio();
      window.removeEventListener("click", handleClick);
    };

    window.addEventListener("click", handleClick);
  }
};

export const isAudioInitialized = () => isInitialized;
