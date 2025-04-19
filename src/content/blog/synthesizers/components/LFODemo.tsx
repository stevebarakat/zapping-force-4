import React, { useState, useRef, useEffect } from "react";

const LFODemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState("sawtooth");
  const [frequency, setFrequency] = useState(220); // A3
  const [lfoTarget, setLfoTarget] = useState("filter");
  const [lfoRate, setLfoRate] = useState(2);
  const [lfoDepth, setLfoDepth] = useState(0.5);
  const [lfoWaveform, setLfoWaveform] = useState("sine");
  const [filterCutoff, setFilterCutoff] = useState(1000);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const filterRef = useRef(null);
  const lfoRef = useRef(null);
  const lfoGainRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const lfoCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop any playing oscillator and LFO
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    if (lfoRef.current) {
      lfoRef.current.stop();
      lfoRef.current.disconnect();
    }

    // Create an analyser for visualization
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // Create a filter
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterCutoff;
    filter.Q.value = 5;
    filterRef.current = filter;

    // Create LFO gain node
    const lfoGain = audioContext.createGain();
    lfoGainRef.current = lfoGain;

    // Set up LFO gain based on target
    if (lfoTarget === "filter") {
      // Scale for filter cutoff modulation
      lfoGain.gain.value = filterCutoff * lfoDepth;
    } else if (lfoTarget === "pitch") {
      // Scale for pitch modulation
      lfoGain.gain.value = 50 * lfoDepth; // 50 cents max
    } else if (lfoTarget === "volume") {
      // Scale for volume modulation
      lfoGain.gain.value = lfoDepth;
    }

    // Create LFO
    const lfo = audioContext.createOscillator();
    lfo.type = lfoWaveform;
    lfo.frequency.value = lfoRate;
    lfo.connect(lfoGain);
    lfoRef.current = lfo;

    // Create the main oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillatorRef.current = oscillator;

    // Create volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;

    // Connect based on LFO target
    if (lfoTarget === "filter") {
      // Connect LFO to filter cutoff
      lfoGain.connect(filter.frequency);

      // Connect audio path
      oscillator.connect(filter);
      filter.connect(gainNode);
    } else if (lfoTarget === "pitch") {
      // Connect LFO to oscillator frequency
      lfoGain.connect(oscillator.detune);

      // Connect audio path
      oscillator.connect(filter);
      filter.connect(gainNode);
    } else if (lfoTarget === "volume") {
      // Connect audio path
      oscillator.connect(filter);
      filter.connect(gainNode);

      // LFO modulates the gain node
      // Add a constant offset to avoid negative values
      gainNode.gain.value = 0.5;
      lfoGain.connect(gainNode.gain);
    }

    // Connect to output
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    // Start oscillator and LFO
    oscillator.start();
    lfo.start();

    // Start visualization
    drawWaveform();
    drawLfo();

    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (lfoRef.current) {
      lfoRef.current.stop();
      lfoRef.current.disconnect();
      lfoRef.current = null;
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

  // Draw waveform visualization
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

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

      // Draw info
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#4b5563";
      ctx.textAlign = "left";
      ctx.fillText(`Modulating: ${getLfoTargetDisplay()}`, 10, 20);
      ctx.fillText(`LFO Rate: ${lfoRate.toFixed(1)} Hz`, 10, 40);
    };

    draw();
  };

  // Draw LFO visualization
  const drawLfo = () => {
    if (!lfoCanvasRef.current) return;

    const canvas = lfoCanvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < height; y += height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = "#d1d5db";
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Set line style for waveform
    ctx.strokeStyle = "#10b981"; // Green
    ctx.lineWidth = 3;

    // Start drawing path
    ctx.beginPath();

    // Calculate center Y position
    const centerY = height / 2;

    // Draw LFO waveform (2 complete cycles)
    const cycles = 2;

    for (let x = 0; x < width; x++) {
      // Calculate the normalized position in the wave cycle
      const t = (x / width) * Math.PI * 2 * cycles;

      // Calculate Y position based on waveform type
      let y = centerY;

      switch (lfoWaveform) {
        case "sine":
          y = centerY + Math.sin(t) * (height / 3);
          break;
        case "square":
          y = centerY + (Math.sin(t) > 0 ? 1 : -1) * (height / 3);
          break;
        case "sawtooth":
          y =
            centerY +
            ((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * height * 0.6;
          break;
        case "triangle":
          y =
            centerY +
            (Math.abs((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) - 0.25) *
              height *
              1.2;
          break;
        default:
          y = centerY;
      }

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Stroke the path
    ctx.stroke();

    // Add LFO label
    ctx.font = "var(--font-size-xs) sans-serif";
    ctx.fillStyle = "#4b5563";
    ctx.textAlign = "center";
    ctx.fillText("LFO Shape", width / 2, height - 10);
  };

  // Helper to get display name for LFO target
  const getLfoTargetDisplay = () => {
    switch (lfoTarget) {
      case "filter":
        return "Filter Cutoff";
      case "pitch":
        return "Pitch";
      case "volume":
        return "Volume";
      default:
        return lfoTarget;
    }
  };

  // Update LFO parameters when they change
  useEffect(() => {
    if (lfoRef.current && audioContextRef.current) {
      lfoRef.current.frequency.setValueAtTime(
        lfoRate,
        audioContextRef.current.currentTime
      );
      lfoRef.current.type = lfoWaveform;

      if (lfoGainRef.current) {
        if (lfoTarget === "filter") {
          lfoGainRef.current.gain.setValueAtTime(
            filterCutoff * lfoDepth,
            audioContextRef.current.currentTime
          );
        } else if (lfoTarget === "pitch") {
          lfoGainRef.current.gain.setValueAtTime(
            50 * lfoDepth, // 50 cents max
            audioContextRef.current.currentTime
          );
        } else if (lfoTarget === "volume") {
          lfoGainRef.current.gain.setValueAtTime(
            lfoDepth,
            audioContextRef.current.currentTime
          );
        }
      }
    }

    if (lfoCanvasRef.current) {
      drawLfo();
    }
  }, [lfoRate, lfoDepth, lfoWaveform]);

  // When LFO target changes, need to restart the sound
  useEffect(() => {
    if (isPlaying) {
      stopSound();
      startSound();
    }
  }, [lfoTarget]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="lfo-demo">
      <div className="visualization-container">
        <div className="visualization-row">
          <div className="visualization-column">
            <h3 className="visualization-title">Audio Output</h3>
            <canvas
              ref={canvasRef}
              width={300}
              height={150}
              className="visualization-canvas"
            />
          </div>
          <div className="visualization-column">
            <h3 className="visualization-title">LFO Waveform</h3>
            <canvas
              ref={lfoCanvasRef}
              width={300}
              height={150}
              className="visualization-canvas"
            />
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="control-row">
          <div className="control-section">
            <h3 className="control-title">LFO Target</h3>
            <div className="button-group">
              {[
                { value: "filter", label: "Filter Cutoff" },
                { value: "pitch", label: "Pitch" },
                { value: "volume", label: "Volume" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLfoTarget(value)}
                  className={`target-button ${
                    lfoTarget === value ? "selected" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="target-description">
              {lfoTarget === "filter" && (
                <p>
                  Modulating the filter cutoff creates a "wah" effect, common in
                  electronic dance music.
                </p>
              )}
              {lfoTarget === "pitch" && (
                <p>
                  Modulating the pitch creates vibrato, similar to how string
                  players or singers add expression.
                </p>
              )}
              {lfoTarget === "volume" && (
                <p>
                  Modulating the volume creates tremolo, like the pulsating
                  volume effect in many guitar amps.
                </p>
              )}
            </div>
          </div>

          <div className="control-section">
            <h3 className="control-title">LFO Shape</h3>
            <div className="button-group">
              {["sine", "square", "sawtooth", "triangle"].map((type) => (
                <button
                  key={type}
                  onClick={() => setLfoWaveform(type)}
                  className={`waveform-button ${
                    lfoWaveform === type ? "selected" : ""
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="control-section sliders">
          <div className="flex highlight-control">
            <label className="control-label">
              LFO Rate: {lfoRate.toFixed(1)} Hz
            </label>
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={lfoRate}
              onChange={(e) => setLfoRate(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="control-info">
              <div className="info-icon">i</div>
              <div className="info-text">
                The LFO Rate determines how fast the modulation happens. Slower
                rates (0.1-2 Hz) create gradual changes, while faster rates
                (4-20 Hz) create more rhythmic effects.
              </div>
            </div>
          </div>

          <div className="flex highlight-control">
            <label className="control-label">
              LFO Depth: {Math.round(lfoDepth * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={lfoDepth}
              onChange={(e) => setLfoDepth(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="control-info">
              <div className="info-icon">i</div>
              <div className="info-text">
                The LFO Depth controls how dramatic the modulation effect is.
                Higher values create more extreme changes.
              </div>
            </div>
          </div>

          <div className="flex">
            <label className="control-label">Sound Waveform</label>
            <div className="button-group">
              {["sine", "square", "sawtooth", "triangle"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setWaveform(type);
                    if (oscillatorRef.current) {
                      oscillatorRef.current.type = type;
                    }
                  }}
                  className={`small-button ${
                    waveform === type ? "selected" : ""
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="play-controls">
          <button onClick={toggleSound} className="play-button">
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>

        <div className="lfo-description">
          <h3>What is an LFO?</h3>
          <p>
            A Low-Frequency Oscillator (LFO) is used to create periodic changes
            in a synthesizer parameter over time. Unlike audio oscillators that
            generate frequencies we can hear (20-20,000 Hz), LFOs typically
            operate at much lower frequencies (0.1-20 Hz), creating rhythmic
            modulation effects rather than audible tones.
          </p>
          <p>
            LFOs are essential for adding movement and evolution to otherwise
            static sounds. Common applications include vibrato (pitch
            modulation), tremolo (volume modulation), and filter sweeps (cutoff
            modulation).
          </p>
        </div>
      </div>

      <style jsx>{`
        .lfo-demo {
          margin: 24px 0;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .visualization-container {
          margin-bottom: 20px;
        }

        .visualization-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .visualization-column {
          flex: 1;
          min-width: 300px;
        }

        .visualization-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .visualization-canvas {
          width: 100%;
          height: 150px;
          background-color: #f9fafb;
          border-radius: 8px;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .control-section {
          flex: 1;
          min-width: 250px;
          margin-bottom: 16px;
        }

        .control-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .target-button,
        .waveform-button {
          padding: 8px 12px;
          background-color: #f3f4f6;
          border: none;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .small-button {
          padding: 6px 10px;
          background-color: #f3f4f6;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .target-button:hover,
        .waveform-button:hover,
        .small-button:hover {
          background-color: #e5e7eb;
        }

        .target-button.selected,
        .waveform-button.selected,
        .small-button.selected {
          background-color: #4f46e5;
          color: white;
        }

        .target-description {
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
          padding: 8px;
          background-color: #f9fafb;
          border-radius: 4px;
          min-height: 60px;
        }

        .target-description p {
          margin: 0;
        }

        .sliders {
          margin-bottom: 16px;
        }

        .flex {
          margin-bottom: 16px;
        }

        .highlight-control {
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #10b981; /* Green */
        }

        .control-label {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: #e5e7eb;
          border-radius: 3px;
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #10b981; /* Green for LFO controls */
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
        }

        .control-info {
          display: flex;
          align-items: flex-start;
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .info-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 16px;
          height: 16px;
          background-color: #e5e7eb;
          color: #4b5563;
          border-radius: 50%;
          font-style: italic;
          font-weight: bold;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .info-text {
          flex: 1;
          line-height: 1.4;
        }

        .play-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .play-button {
          padding: 10px 24px;
          background-color: #10b981; /* Green for LFO demo */
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .play-button:hover {
          background-color: #059669;
        }

        .play-button:active {
          transform: translateY(1px);
        }

        .lfo-description {
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 6px;
          font-size: var(--font-size-xs);
          color: #4b5563;
        }

        .lfo-description h3 {
          font-size: 16px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 8px;
        }

        .lfo-description p {
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .lfo-description p:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

export default LFODemo;
