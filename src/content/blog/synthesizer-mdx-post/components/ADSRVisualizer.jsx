import React, { useState, useRef, useEffect } from "react";

const ADSRVisualizer = () => {
  const [adsr, setADSR] = useState({
    attack: 0.2,
    decay: 0.3,
    sustain: 0.7,
    release: 0.5,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSound, setActiveSound] = useState("synth"); // "synth" or "piano"

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Draw the ADSR envelope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    // Draw timeline labels
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "center";

    // Key pressed indicator
    if (isPlaying) {
      ctx.fillStyle = "rgba(79, 70, 229, 0.1)";
      ctx.fillRect(0, 0, width * 0.7, height);
      ctx.fillStyle = "#9ca3af";
    }

    ctx.fillText("Key Pressed", width * 0.35, height - 5);
    ctx.fillText("Key Released", width * 0.85, height - 5);

    // Draw ADSR envelope
    ctx.beginPath();
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 3;

    const startX = 0;
    const startY = height; // Start at bottom (silence)

    // Starting point
    ctx.moveTo(startX, startY);

    // Calculate ADSR points
    const totalDuration = adsr.attack + adsr.decay + 0.5 + adsr.release; // 0.5 is arbitrary sustain time
    const pixelsPerSecond = (width * 0.7) / (adsr.attack + adsr.decay + 0.5); // Scale to fit 70% of canvas for pressed portion

    // Attack
    const attackX = startX + adsr.attack * pixelsPerSecond;
    ctx.lineTo(attackX, 0); // Top of canvas (max volume)

    // Decay
    const decayX = attackX + adsr.decay * pixelsPerSecond;
    const sustainY = height * (1 - adsr.sustain);
    ctx.lineTo(decayX, sustainY);

    // Sustain (constant until key release)
    const sustainX = width * 0.7; // 70% of width
    ctx.lineTo(sustainX, sustainY);

    // Release
    const releaseX =
      sustainX + width * 0.3 * (adsr.release / (adsr.release + 0.2)); // Scale release to remaining 30%
    ctx.lineTo(releaseX, height);

    // Stroke the path
    ctx.stroke();

    // Add labels
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#4F46E5";

    // "Attack" label
    ctx.textAlign = "center";
    ctx.fillText("A", attackX / 2, height / 2);

    // "Decay" label
    ctx.fillText("D", attackX + (decayX - attackX) / 2, sustainY / 2);

    // "Sustain" label
    ctx.fillText("S", decayX + (sustainX - decayX) / 2, sustainY - 10);

    // "Release" label
    ctx.fillText(
      "R",
      sustainX + (releaseX - sustainX) / 2,
      (height + sustainY) / 2
    );
  }, [adsr, isPlaying]);

  // Play sound with ADSR envelope
  const playSound = () => {
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

    // Create gain node for envelope
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create oscillator
    const oscillator = audioContext.createOscillator();

    // Choose sound type based on activeSound
    if (activeSound === "synth") {
      oscillator.type = "sawtooth";
      oscillator.frequency.value = 440; // A4
    } else {
      // Piano-like sound (simplified approximation)
      oscillator.type = "triangle";
      oscillator.frequency.value = 261.63; // C4

      // Add a second oscillator for harmonics
      const oscillator2 = audioContext.createOscillator();
      oscillator2.type = "sine";
      oscillator2.frequency.value = 523.25; // C5 (octave above)
      oscillator2.connect(gainNode);

      // Start the second oscillator
      oscillator2.start();

      // Store it to stop later
      const originalStop = oscillator.stop;
      oscillator.stop = function () {
        originalStop.apply(this, arguments);
        oscillator2.stop();
      };
    }

    oscillator.connect(gainNode);
    oscillatorRef.current = oscillator;

    // Apply ADSR envelope
    const now = audioContext.currentTime;

    // Start with zero gain
    gainNode.gain.setValueAtTime(0, now);

    // Attack - ramp up to full volume
    gainNode.gain.linearRampToValueAtTime(1, now + adsr.attack);

    // Decay - fall to sustain level
    gainNode.gain.linearRampToValueAtTime(
      adsr.sustain,
      now + adsr.attack + adsr.decay
    );

    // Sustain happens automatically by holding the gain value

    // Start the oscillator
    oscillator.start();

    setIsPlaying(true);
  };

  // Release the sound (apply release phase)
  const releaseSound = () => {
    if (
      !audioContextRef.current ||
      !gainNodeRef.current ||
      !oscillatorRef.current
    )
      return;

    const now = audioContextRef.current.currentTime;

    // Release - ramp down to zero
    gainNodeRef.current.gain.cancelScheduledValues(now);
    gainNodeRef.current.gain.setValueAtTime(
      gainNodeRef.current.gain.value,
      now
    );
    gainNodeRef.current.gain.linearRampToValueAtTime(0, now + adsr.release);

    // Stop oscillator after release time
    setTimeout(() => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
    }, adsr.release * 1000);

    setIsPlaying(false);
  };

  const handleADSRChange = (parameter, value) => {
    setADSR((prev) => ({
      ...prev,
      [parameter]: value,
    }));
  };

  const getPreset = (presetName) => {
    switch (presetName) {
      case "pluck":
        return {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.1,
        };
      case "pad":
        return {
          attack: 0.5,
          decay: 0.5,
          sustain: 0.8,
          release: 1.0,
        };
      case "piano":
        return {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.7,
          release: 0.4,
        };
      case "brass":
        return {
          attack: 0.1,
          decay: 0.1,
          sustain: 0.9,
          release: 0.1,
        };
      default:
        return adsr;
    }
  };

  const applyPreset = (presetName) => {
    setADSR(getPreset(presetName));
  };

  // Clean up
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
    <div className="adsr-visualizer">
      <div className="waveform-container">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="adsr-canvas"
        />
      </div>

      <div className="controls">
        <div className="presets-section">
          <h3 className="control-title">Presets</h3>
          <div className="preset-buttons">
            <button
              onClick={() => applyPreset("pluck")}
              className="preset-button"
            >
              Pluck
            </button>
            <button
              onClick={() => applyPreset("pad")}
              className="preset-button"
            >
              Pad
            </button>
            <button
              onClick={() => applyPreset("piano")}
              className="preset-button"
            >
              Piano
            </button>
            <button
              onClick={() => applyPreset("brass")}
              className="preset-button"
            >
              Brass
            </button>
          </div>
        </div>

        <div className="sound-toggle">
          <button
            onClick={() => setActiveSound("synth")}
            className={`sound-button ${
              activeSound === "synth" ? "selected" : ""
            }`}
          >
            Synth Sound
          </button>
          <button
            onClick={() => setActiveSound("piano")}
            className={`sound-button ${
              activeSound === "piano" ? "selected" : ""
            }`}
          >
            Piano-like Sound
          </button>
        </div>

        <div className="adsr-sliders">
          <div className="flex">
            <label className="control-label">
              Attack: {adsr.attack.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0.01"
              max="2"
              step="0.01"
              value={adsr.attack}
              onChange={(e) =>
                handleADSRChange("attack", parseFloat(e.target.value))
              }
              className="slider"
            />
            <div className="parameter-description">
              How quickly the sound reaches full volume
            </div>
          </div>

          <div className="flex">
            <label className="control-label">
              Decay: {adsr.decay.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0.01"
              max="2"
              step="0.01"
              value={adsr.decay}
              onChange={(e) =>
                handleADSRChange("decay", parseFloat(e.target.value))
              }
              className="slider"
            />
            <div className="parameter-description">
              How quickly the sound falls to the sustain level
            </div>
          </div>

          <div className="flex">
            <label className="control-label">
              Sustain: {(adsr.sustain * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={adsr.sustain}
              onChange={(e) =>
                handleADSRChange("sustain", parseFloat(e.target.value))
              }
              className="slider"
            />
            <div className="parameter-description">
              The volume level while the key is held down
            </div>
          </div>

          <div className="flex">
            <label className="control-label">
              Release: {adsr.release.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0.01"
              max="3"
              step="0.01"
              value={adsr.release}
              onChange={(e) =>
                handleADSRChange("release", parseFloat(e.target.value))
              }
              className="slider"
            />
            <div className="parameter-description">
              How quickly the sound fades after release
            </div>
          </div>
        </div>

        <div className="play-controls">
          <button
            onMouseDown={playSound}
            onMouseUp={releaseSound}
            onMouseLeave={isPlaying ? releaseSound : undefined}
            onTouchStart={playSound}
            onTouchEnd={releaseSound}
            className="play-button"
          >
            Hold to Play
          </button>
        </div>

        <div className="adsr-description">
          <p>
            The ADSR envelope shapes how a sound evolves over time. Try
            different settings and notice how they affect the character of the
            sound. Fast attack with low sustain creates percussive sounds, while
            slow attack with high sustain creates pad-like textures.
          </p>
        </div>
      </div>

      <style jsx>{`
        .adsr-visualizer {
          margin: 24px 0;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .adsr-canvas {
          width: 100%;
          height: 200px;
          background-color: #f9fafb;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .presets-section {
          margin-bottom: 16px;
        }

        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .preset-button {
          padding: 6px 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-button:hover {
          background-color: #e5e7eb;
        }

        .sound-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .sound-button {
          flex: 1;
          padding: 8px 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: var(--font-size-xs);
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sound-button:hover {
          background-color: #e5e7eb;
        }

        .sound-button.selected {
          background-color: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .adsr-sliders {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .flex {
          margin-bottom: 12px;
        }

        .control-label {
          display: block;
          font-size: var(--font-size-xs);
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 4px;
        }

        .parameter-description {
          font-size: 12px;
          color: #6b7280;
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

        .play-controls {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }

        .play-button {
          padding: 12px 32px;
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
          background-color: #3730a3;
        }

        .adsr-description {
          margin-top: 16px;
          padding: 12px;
          background-color: #f9fafb;
          border-radius: 6px;
          font-size: var(--font-size-xs);
          color: #4b5563;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default ADSRVisualizer;
