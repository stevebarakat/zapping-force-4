import React, { useState, useRef, useEffect } from "react";
import styles from "./FilterDemo.module.css";

type AudioContextType = AudioContext & {
  createBiquadFilter(): BiquadFilterNode;
};

function FilterDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState<OscillatorType>("sawtooth");
  const [frequency, setFrequency] = useState(220); // A3
  const [filterType, setFilterType] = useState<BiquadFilterType>("lowpass");
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(5);
  const [showSpectrum, setShowSpectrum] = useState(false);

  const audioContextRef = useRef<AudioContextType | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop any playing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create an analyser for visualization
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // Create a filter
    const filter = audioContext.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = cutoff;
    filter.Q.value = resonance;
    filter.connect(analyser);
    filterRef.current = filter;

    // Connect analyser to output
    analyser.connect(audioContext.destination);

    // Create an oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(filter);

    // Start the oscillator
    oscillator.start();
    oscillatorRef.current = oscillator;

    // Start visualization
    drawVisualization();

    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopSound();
    } else {
      startSound();
    }
  };

  // Draw either waveform or frequency spectrum
  const drawVisualization = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Determine which visualization to show
    if (showSpectrum) {
      // Frequency spectrum visualization
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        // Draw frequency bars
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;

          // Color based on frequency range
          const hue = (i / bufferLength) * 240; // Blue to red gradient
          ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;

          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
          if (x > width) break;
        }

        // Draw cutoff frequency indicator
        const logMax = Math.log10(
          audioContextRef.current?.sampleRate || 44100 / 2
        );
        const logCutoff = Math.log10(cutoff);
        const cutoffX = (logCutoff / logMax) * width;

        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // Red
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cutoffX, 0);
        ctx.lineTo(cutoffX, height);
        ctx.stroke();

        // Label for cutoff
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "rgba(239, 68, 68, 1)";
        ctx.textAlign = "center";
        ctx.fillText(`${cutoff} Hz`, cutoffX, 15);

        // Draw filter type and resonance info
        ctx.fillStyle = "#4b5563";
        ctx.textAlign = "left";
        ctx.fillText(
          `Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`,
          10,
          15
        );
        ctx.fillText(`Q: ${resonance.toFixed(1)}`, 10, 35);
      };

      draw();
    } else {
      // Waveform visualization
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);

        analyser.getFloatTimeDomainData(dataArray);

        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#4F46E5";
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i];
          const y = ((v + 1) / 2) * height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();

        // Draw filter info
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#4b5563";
        ctx.textAlign = "left";
        ctx.fillText(
          `Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`,
          10,
          15
        );
        ctx.fillText(`Cutoff: ${cutoff} Hz`, 10, 35);
        ctx.fillText(`Q: ${resonance.toFixed(1)}`, 10, 55);
      };

      draw();
    }
  };

  // Update filter parameters
  useEffect(() => {
    if (filterRef.current && audioContextRef.current) {
      filterRef.current.type = filterType;
      filterRef.current.frequency.setValueAtTime(
        cutoff,
        audioContextRef.current.currentTime
      );
      filterRef.current.Q.setValueAtTime(
        resonance,
        audioContextRef.current.currentTime
      );
    }
  }, [filterType, cutoff, resonance]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.filterDemo}>
      <div className={styles.visualizationContainer}>
        <div className={styles.visualizationHeader}>
          <h3 className={styles.visualizationTitle}>
            {showSpectrum ? "Frequency Spectrum" : "Waveform"}
          </h3>
          <button
            onClick={() => setShowSpectrum(!showSpectrum)}
            className={styles.toggleButton}
          >
            Show {showSpectrum ? "Waveform" : "Spectrum"}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className={styles.visualizationCanvas}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>Filter Type</h3>
            <div className={styles.buttonGroup}>
              {["lowpass", "highpass", "bandpass", "notch"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as BiquadFilterType)}
                  className={`${styles.filterButton} ${
                    filterType === type ? styles.selected : ""
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlSection}>
            <h3 className={styles.controlTitle}>Waveform</h3>
            <div className={styles.buttonGroup}>
              {["sine", "square", "sawtooth", "triangle"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setWaveform(type as OscillatorType);
                    if (oscillatorRef.current) {
                      oscillatorRef.current.type = type as OscillatorType;
                    }
                  }}
                  className={`${styles.waveformButton} ${
                    waveform === type ? styles.selected : ""
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.controlSection}>
          <div className={`${styles.flex} ${styles.highlightControl}`}>
            <label className={styles.controlLabel}>
              Cutoff Frequency: {cutoff} Hz
            </label>
            <div className={styles.sliderWithInfographic}>
              <div className={styles.filterInfographic}>
                {filterType === "lowpass" && (
                  <>
                    <div className={styles.freqPass}>PASS</div>
                    <div className={styles.freqCutoff}>|</div>
                    <div className={styles.freqReject}>REJECT</div>
                  </>
                )}
                {filterType === "highpass" && (
                  <>
                    <div className={styles.freqReject}>REJECT</div>
                    <div className={styles.freqCutoff}>|</div>
                    <div className={styles.freqPass}>PASS</div>
                  </>
                )}
                {(filterType === "bandpass" || filterType === "notch") && (
                  <>
                    <div
                      className={
                        filterType === "bandpass"
                          ? styles.freqReject
                          : styles.freqPass
                      }
                    >
                      {filterType === "bandpass" ? "REJECT" : "PASS"}
                    </div>
                    <div className={styles.freqCutoff}>|</div>
                    <div
                      className={
                        filterType === "bandpass"
                          ? styles.freqPass
                          : styles.freqReject
                      }
                    >
                      {filterType === "bandpass" ? "PASS" : "REJECT"}
                    </div>
                    <div className={styles.freqCutoff}>|</div>
                    <div
                      className={
                        filterType === "bandpass"
                          ? styles.freqReject
                          : styles.freqPass
                      }
                    >
                      {filterType === "bandpass" ? "REJECT" : "PASS"}
                    </div>
                  </>
                )}
              </div>
              <input
                type="range"
                min="20"
                max="20000"
                step="1"
                value={cutoff}
                onChange={(e) => setCutoff(parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.frequencyMarkers}>
              <span>20 Hz</span>
              <span>100 Hz</span>
              <span>1 kHz</span>
              <span>10 kHz</span>
              <span>20 kHz</span>
            </div>
            <div className={styles.controlInfo}>
              <div className={styles.infoIcon}>i</div>
              <div className={styles.infoText}>
                The cutoff frequency determines where the filter begins to
                affect the sound.
                {filterType === "lowpass" &&
                  " Low-pass filters allow frequencies below the cutoff point to pass through."}
                {filterType === "highpass" &&
                  " High-pass filters allow frequencies above the cutoff point to pass through."}
                {filterType === "bandpass" &&
                  " Band-pass filters allow frequencies around the cutoff point to pass through."}
                {filterType === "notch" &&
                  " Notch filters reject frequencies around the cutoff point."}
              </div>
            </div>
          </div>

          <div className={styles.flex}>
            <label className={styles.controlLabel}>
              Resonance (Q): {resonance.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={resonance}
              onChange={(e) => setResonance(parseFloat(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.controlInfo}>
              <div className={styles.infoIcon}>i</div>
              <div className={styles.infoText}>
                Resonance (Q) creates emphasis around the cutoff frequency.
                Higher values create a more pronounced peak or notch effect.
              </div>
            </div>
          </div>

          <div className={styles.flex}>
            <label className={styles.controlLabel}>
              Frequency: {frequency} Hz
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="1"
              value={frequency}
              onChange={(e) => {
                const newFreq = parseFloat(e.target.value);
                setFrequency(newFreq);
                if (oscillatorRef.current && audioContextRef.current) {
                  oscillatorRef.current.frequency.setValueAtTime(
                    newFreq,
                    audioContextRef.current.currentTime
                  );
                }
              }}
              className={styles.slider}
            />
          </div>
        </div>

        <div className={styles.playControls}>
          <button onClick={toggleSound} className={styles.playButton}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterDemo;
