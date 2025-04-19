import * as Tone from "tone";

class AudioCoordinator {
  private activeComponent: string | null = null;
  private componentTransports: Map<
    string,
    ReturnType<typeof Tone.getTransport>
  > = new Map();

  registerComponent(
    componentId: string,
    cleanupCallback: () => void
  ): ReturnType<typeof Tone.getTransport> {
    // If another component is active, stop it
    if (this.activeComponent && this.activeComponent !== componentId) {
      const activeTransport = this.componentTransports.get(
        this.activeComponent
      );
      if (activeTransport) {
        activeTransport.stop();
        activeTransport.cancel();
      }
    }

    // Get a new transport for this component
    const transport = Tone.getTransport();
    this.componentTransports.set(componentId, transport);
    this.activeComponent = componentId;

    // Set up cleanup
    transport.on("stop", () => {
      if (this.activeComponent === componentId) {
        this.activeComponent = null;
        cleanupCallback();
      }
    });

    return transport;
  }

  unregisterComponent(componentId: string): void {
    const transport = this.componentTransports.get(componentId);
    if (transport) {
      transport.stop();
      transport.cancel();
      this.componentTransports.delete(componentId);
      if (this.activeComponent === componentId) {
        this.activeComponent = null;
      }
    }
  }

  getComponentTransport(
    componentId: string
  ): ReturnType<typeof Tone.getTransport> | undefined {
    return this.componentTransports.get(componentId);
  }

  isComponentActive(componentId: string): boolean {
    return this.activeComponent === componentId;
  }
}

export const audioCoordinator = new AudioCoordinator();
