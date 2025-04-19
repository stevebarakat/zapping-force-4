import React, { useState, useRef, useEffect } from "react";

const FilterDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState("sawtooth");
  const [frequency, setFrequency] = useState(220); // A3
  const [filterType, setFilterType] = useState("lowpass");
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(5);
  const [showSpectrum, setShowSpectrum] = useState(false);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const filterRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
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
        const logMax = Math.log10(audioContextRef.current.sampleRate / 2);
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
    <div className="filter-demo">
      <div className="visualization-container">
        <div className="visualization-header">
          <h3 className="visualization-title">
            {showSpectrum ? "Frequency Spectrum" : "Waveform"}
          </h3>
          <button
            onClick={() => setShowSpectrum(!showSpectrum)}
            className="toggle-button"
          >
            Show {showSpectrum ? "Waveform" : "Spectrum"}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="visualization-canvas"
        />
      </div>

      <div className="controls">
        <div className="control-row">
          <div className="control-section">
            <h3 className="control-title">Filter Type</h3>
            <div className="button-group">
              {["lowpass", "highpass", "bandpass", "notch"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`filter-button ${
                    filterType === type ? "selected" : ""
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h3 className="control-title">Waveform</h3>
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
                  className={`waveform-button ${
                    waveform === type ? "selected" : ""
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
              Cutoff Frequency: {cutoff} Hz
            </label>
            <div className="slider-with-infographic">
              <div className="filter-infographic">
                {filterType === "lowpass" && (
                  <>
                    <div className="freq-pass">PASS</div>
                    <div className="freq-cutoff">|</div>
                    <div className="freq-reject">REJECT</div>
                  </>
                )}
                {filterType === "highpass" && (
                  <>
                    <div className="freq-reject">REJECT</div>
                    <div className="freq-cutoff">|</div>
                    <div className="freq-pass">PASS</div>
                  </>
                )}
                {(filterType === "bandpass" || filterType === "notch") && (
                  <>
                    <div
                      className={
                        filterType === "bandpass" ? "freq-reject" : "freq-pass"
                      }
                    >
                      {filterType === "bandpass" ? "REJECT" : "PASS"}
                    </div>
                    <div className="freq-cutoff">|</div>
                    <div
                      className={
                        filterType === "bandpass" ? "freq-pass" : "freq-reject"
                      }
                    >
                      {filterType === "bandpass" ? "PASS" : "REJECT"}
                    </div>
                    <div className="freq-cutoff">|</div>
                    <div
                      className={
                        filterType === "bandpass" ? "freq-reject" : "freq-pass"
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
                className="slider"
              />
            </div>
            <div className="frequency-markers">
              <span>20 Hz</span>
              <span>100 Hz</span>
              <span>1 kHz</span>
              <span>10 kHz</span>
              <span>20 kHz</span>
            </div>
            <div className="control-info">
              <div className="info-icon">i</div>
              <div className="info-text">
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

          <div className="flex">
            <label className="control-label">
              Resonance (Q): {resonance.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={resonance}
              onChange={(e) => setResonance(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="control-info">
              <div className="info-icon">i</div>
              <div className="info-text">
                Resonance (Q) creates emphasis around the cutoff frequency.
                Higher values create a more pronounced peak or notch effect.
              </div>
            </div>
          </div>

          <div className="flex">
            <label className="control-label">Frequency: {frequency} Hz</label>
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
              className="slider"
            />
          </div>
        </div>

        <div className="play-controls">
          <button onClick={toggleSound} className="play-button">
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .filter-demo {
          margin: 24px 0;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .visualization-container {
          margin-bottom: 20px;
        }

        .visualization-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .visualization-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .toggle-button {
          padding: 4px 8px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          color: #4b5563;
          cursor: pointer;
        }

        .toggle-button:hover {
          background-color: #e5e7eb;
        }

        .visualization-canvas {
          width: 100%;
          height: 200px;
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
          min-width: 200px;
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
        }

        .filter-button,
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

        .filter-button:hover,
        .waveform-button:hover {
          background-color: #e5e7eb;
        }

        .filter-button.selected,
        .waveform-button.selected {
          background-color: #4f46e5;
          color: white;
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
          border-left: 3px solid #4f46e5;
        }

        .control-label {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .slider-with-infographic {
          position: relative;
          margin-bottom: 4px;
        }

        .filter-infographic {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          padding: 0 10px;
        }

        .freq-pass {
          color: #10b981; /* Green */
        }

        .freq-reject {
          color: #ef4444; /* Red */
        }

        .freq-cutoff {
          color: #6b7280; /* Gray */
          font-weight: bold;
        }

        .frequency-markers {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #9ca3af;
          margin-top: 4px;
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
          background: #4f46e5;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #4f46e5;
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
        }

        .play-button {
          padding: 10px 24px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .play-button:hover {
          background-color: #4338ca;
        }

        .play-button:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
};

export default FilterDemo;
