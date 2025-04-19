import * as Tone from "tone";

type AudioComponent = {
  id: string;
  stopPlayback: () => void;
  transport: ReturnType<typeof Tone.getTransport>;
};

class AudioCoordinator {
  private static instance: AudioCoordinator;
  private components: Map<string, AudioComponent> = new Map();

  private constructor() {}

  static getInstance(): AudioCoordinator {
    if (!AudioCoordinator.instance) {
      AudioCoordinator.instance = new AudioCoordinator();
    }
    return AudioCoordinator.instance;
  }

  registerComponent(
    componentId: string,
    stopPlayback: () => void
  ): ReturnType<typeof Tone.getTransport> {
    // Get the transport instance for this component
    const transport = Tone.getTransport();

    // Store the component
    this.components.set(componentId, {
      id: componentId,
      stopPlayback,
      transport,
    });

    return transport;
  }

  unregisterComponent(componentId: string) {
    const component = this.components.get(componentId);
    if (component) {
      component.stopPlayback();
      this.components.delete(componentId);
    }
  }

  getComponentTransport(
    componentId: string
  ): ReturnType<typeof Tone.getTransport> | null {
    return this.components.get(componentId)?.transport || null;
  }

  isComponentActive(componentId: string): boolean {
    return this.components.has(componentId);
  }

  stopAllPlayback() {
    this.components.forEach((component) => {
      component.stopPlayback();
      component.transport.stop();
    });
  }
}

export const audioCoordinator = AudioCoordinator.getInstance();
