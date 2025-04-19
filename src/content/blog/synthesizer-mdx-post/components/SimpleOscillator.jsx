import React, { useState, useRef, useEffect } from "react";

const SimpleOscillator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440); // A4 note
  const [waveform, setWaveform] = useState("sine");
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
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
    const cycles = frequency < 100 ? 1 : 3; // Show more cycles for higher frequencies

    for (let x = 0; x < width; x++) {
      // Calculate the normalized position in the wave cycle
      const t = (x / width) * Math.PI * 2 * cycles;

      // Calculate Y position based on waveform type
      let y = centerY;

      switch (waveform) {
        case "sine":
          y = centerY + Math.sin(t) * (height / 3) * volume;
          break;
        case "square":
          y = centerY + (Math.sin(t) > 0 ? 1 : -1) * (height / 3) * volume;
          break;
        case "sawtooth":
          y =
            centerY +
            ((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * height * 0.6 * volume;
          break;
        case "triangle":
          y =
            centerY +
            (Math.abs((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) - 0.25) *
              height *
              1.2 *
              volume;
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
  }, [waveform, frequency, volume]);

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

    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create an oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);

    // Start the oscillator
    oscillator.start();
    oscillatorRef.current = oscillator;

    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
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
    // Update the oscillator if it's playing
    if (oscillatorRef.current) {
      oscillatorRef.current.type = newWaveform;
    }
  };

  const handleFrequencyChange = (e) => {
    const newFrequency = parseFloat(e.target.value);
    setFrequency(newFrequency);
    // Update the oscillator if it's playing
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
    };
  }, []);

  // Notes for the piano keys
  const notes = [
    { name: "C4", frequency: 261.63 },
    { name: "D4", frequency: 293.66 },
    { name: "E4", frequency: 329.63 },
    { name: "F4", frequency: 349.23 },
    { name: "G4", frequency: 392.0 },
    { name: "A4", frequency: 440.0 },
    { name: "B4", frequency: 493.88 },
    { name: "C5", frequency: 523.25 },
  ];

  return (
    <div className="simple-oscillator">
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

        <div className="control-section">
          <div className="piano-keys">
            {notes.map((note) => (
              <button
                key={note.name}
                className="piano-key"
                onClick={() => {
                  setFrequency(note.frequency);
                  if (oscillatorRef.current && audioContextRef.current) {
                    oscillatorRef.current.frequency.setValueAtTime(
                      note.frequency,
                      audioContextRef.current.currentTime
                    );
                  }
                }}
              >
                {note.name}
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
        .simple-oscillator {
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

        .piano-keys {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
        }

        .piano-key {
          flex: 1;
          padding: 12px 8px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.1s;
        }

        .piano-key:hover {
          background-color: #e5e7eb;
        }

        .piano-key:active {
          background-color: #d1d5db;
          transform: translateY(2px);
        }

        .sliders {
          margin-bottom: 16px;
        }

        .flex {
          margin-bottom: 12px;
        }

        .control-label {
          display: block;
          font-size: var(--font-size-xs);
          color: #4b5563;
          margin-bottom: 4px;
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

export default SimpleOscillator;
