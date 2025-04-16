import * as Tone from "tone";

type AudioComponent = {
  id: string;
  stopPlayback: () => void;
};

class AudioCoordinator {
  private static instance: AudioCoordinator;
  private activeComponent: AudioComponent | null = null;

  private constructor() {}

  static getInstance(): AudioCoordinator {
    if (!AudioCoordinator.instance) {
      AudioCoordinator.instance = new AudioCoordinator();
    }
    return AudioCoordinator.instance;
  }

  registerComponent(component: AudioComponent) {
    // If there's already an active component, stop it
    if (this.activeComponent && this.activeComponent.id !== component.id) {
      this.activeComponent.stopPlayback();
    }
    this.activeComponent = component;
  }

  unregisterComponent(componentId: string) {
    if (this.activeComponent?.id === componentId) {
      this.activeComponent.stopPlayback();
      this.activeComponent = null;
    }
  }

  stopAllPlayback() {
    if (this.activeComponent) {
      this.activeComponent.stopPlayback();
      this.activeComponent = null;
    }
    // Also stop the Tone.js transport
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
}

export const audioCoordinator = AudioCoordinator.getInstance();
