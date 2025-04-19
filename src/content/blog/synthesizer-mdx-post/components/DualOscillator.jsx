import React, { useState, useRef, useEffect } from "react";

const DualOscillator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440); // A4 note
  const [waveform, setWaveform] = useState("sawtooth");
  const [volume, setVolume] = useState(0.5);
  const [detune, setDetune] = useState(7); // Slight detuning for second oscillator

  const audioContextRef = useRef(null);
  const oscillator1Ref = useRef(null);
  const oscillator2Ref = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);

  // Drawing the waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Set line style for waveform
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 2;

    // Start drawing path
    ctx.beginPath();

    // Calculate center Y position
    const centerY = height / 2;

    // Draw waveform
    const cycles = 3;

    for (let x = 0; x < width; x++) {
      // Calculate the normalized position in the wave cycle
      const t = (x / width) * Math.PI * 2 * cycles;

      // Calculate Y position for oscillator 1
      let y1 = calculateOscillatorY(t, waveform, centerY, height, volume);

      // Calculate slightly detuned t for oscillator 2
      const detuneFactor = 1 + detune / 1200; // Convert cents to frequency ratio
      const t2 = t * detuneFactor;

      // Calculate Y position for oscillator 2
      let y2 = calculateOscillatorY(t2, waveform, centerY, height, volume);

      // Average the waves for visualization (simple approximation of mixing)
      let y = (y1 + y2) / 2;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // Stroke the path
    ctx.stroke();

    // Draw a second, lighter line to represent the detuned oscillator
    ctx.strokeStyle = "rgba(79, 70, 229, 0.3)"; // Lighter purple
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * 2 * cycles;
      const detuneFactor = 1 + detune / 1200;
      const t2 = t * detuneFactor;
      let y = calculateOscillatorY(t2, waveform, centerY, height, volume);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [waveform, frequency, volume, detune]);

  // Helper function to calculate Y position based on waveform type
  const calculateOscillatorY = (
    t,
    waveformType,
    centerY,
    height,
    amplitude
  ) => {
    switch (waveformType) {
      case "sine":
        return centerY + Math.sin(t) * (height / 3) * amplitude;
      case "square":
        return centerY + (Math.sin(t) > 0 ? 1 : -1) * (height / 3) * amplitude;
      case "sawtooth":
        return (
          centerY +
          ((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * height * 0.6 * amplitude
        );
      case "triangle":
        return (
          centerY +
          (Math.abs((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) - 0.25) *
            height *
            1.2 *
            amplitude
        );
      default:
        return centerY;
    }
  };

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop any playing oscillators
    if (oscillator1Ref.current) {
      oscillator1Ref.current.stop();
      oscillator1Ref.current.disconnect();
    }

    if (oscillator2Ref.current) {
      oscillator2Ref.current.stop();
      oscillator2Ref.current.disconnect();
    }

    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create oscillator 1
    const oscillator1 = audioContext.createOscillator();
    oscillator1.type = waveform;
    oscillator1.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator1.connect(gainNode);

    // Create oscillator 2 with detune
    const oscillator2 = audioContext.createOscillator();
    oscillator2.type = waveform;
    oscillator2.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator2.detune.setValueAtTime(detune, audioContext.currentTime); // Detune in cents
    oscillator2.connect(gainNode);

    // Start the oscillators
    oscillator1.start();
    oscillator2.start();

    oscillator1Ref.current = oscillator1;
    oscillator2Ref.current = oscillator2;

    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillator1Ref.current) {
      oscillator1Ref.current.stop();
      oscillator1Ref.current.disconnect();
      oscillator1Ref.current = null;
    }

    if (oscillator2Ref.current) {
      oscillator2Ref.current.stop();
      oscillator2Ref.current.disconnect();
      oscillator2Ref.current = null;
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

  const handleWaveformChange = (newWaveform) => {
    setWaveform(newWaveform);
    // Update the oscillators if they're playing
    if (oscillator1Ref.current) {
      oscillator1Ref.current.type = newWaveform;
    }
    if (oscillator2Ref.current) {
      oscillator2Ref.current.type = newWaveform;
    }
  };

  const handleFrequencyChange = (e) => {
    const newFrequency = parseFloat(e.target.value);
    setFrequency(newFrequency);
    // Update the oscillators if they're playing
    if (oscillator1Ref.current && audioContextRef.current) {
      oscillator1Ref.current.frequency.setValueAtTime(
        newFrequency,
        audioContextRef.current.currentTime
      );
    }
    if (oscillator2Ref.current && audioContextRef.current) {
      oscillator2Ref.current.frequency.setValueAtTime(
        newFrequency,
        audioContextRef.current.currentTime
      );
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    // Update the gain node if it exists
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        newVolume,
        audioContextRef.current.currentTime
      );
    }
  };

  const handleDetuneChange = (e) => {
    const newDetune = parseFloat(e.target.value);
    setDetune(newDetune);
    // Update oscillator 2 if it's playing
    if (oscillator2Ref.current && audioContextRef.current) {
      oscillator2Ref.current.detune.setValueAtTime(
        newDetune,
        audioContextRef.current.currentTime
      );
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillator1Ref.current) {
        oscillator1Ref.current.stop();
        oscillator1Ref.current.disconnect();
      }
      if (oscillator2Ref.current) {
        oscillator2Ref.current.stop();
        oscillator2Ref.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="dual-oscillator">
      <div className="waveform-container">
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          className="waveform-canvas"
        />
      </div>

      <div className="controls">
        <div className="control-section">
          <h3 className="control-title">Waveform</h3>
          <div className="button-group">
            {["sine", "square", "sawtooth", "triangle"].map((type) => (
              <button
                key={type}
                onClick={() => handleWaveformChange(type)}
                className={`waveform-button ${
                  waveform === type ? "selected" : ""
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="control-section sliders">
          <div className="flex">
            <label className="control-label">
              Frequency: {frequency.toFixed(1)} Hz
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="1"
              value={frequency}
              onChange={handleFrequencyChange}
              className="slider"
            />
          </div>

          <div className="flex highlight-control">
            <label className="control-label">Detune: {detune} cents</label>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={detune}
              onChange={handleDetuneChange}
              className="slider"
            />
            <div className="control-info">
              <div className="info-icon">i</div>
              <div className="info-text">
                Detune adds a second oscillator slightly offset from the main
                frequency. This creates a richer "fatter" sound similar to how
                multiple musicians playing together creates a fuller sound than
                a single instrument.
              </div>
            </div>
          </div>

          <div className="flex">
            <label className="control-label">
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
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
        .dual-oscillator {
          margin: 24px 0;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .waveform-container {
          margin-bottom: 16px;
        }

        .waveform-canvas {
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

        .control-section {
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

        .waveform-button:hover {
          background-color: #e5e7eb;
        }

        .waveform-button.selected {
          background-color: #4f46e5;
          color: white;
        }

        .sliders {
          margin-bottom: 16px;
        }

        .flex {
          margin-bottom: 12px;
          position: relative;
        }

        .highlight-control {
          padding: 12px;
          background-color: #f9fafb;
          border-radius: 6px;
          border-left: 3px solid #4f46e5;
        }

        .control-label {
          display: block;
          font-size: var(--font-size-xs);
          color: #4b5563;
          margin-bottom: 6px;
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

export default DualOscillator;
