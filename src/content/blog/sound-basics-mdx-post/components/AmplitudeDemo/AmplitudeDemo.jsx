import React, { useState, useRef, useEffect } from "react";
import "@/styles/shared/dark-mode.css";

const AmplitudeDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [amplitude, setAmplitude] = useState(0.5);
  const [frequency, setFrequency] = useState(440);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  // Common sounds and their approximate dB levels for comparison
  const soundComparisons = [
    { name: "Threshold of Hearing", dB: 0, amplitude: 0.0001 },
    { name: "Rustling Leaves", dB: 20, amplitude: 0.01 },
    { name: "Whisper", dB: 30, amplitude: 0.03 },
    { name: "Library", dB: 40, amplitude: 0.1 },
    { name: "Normal Conversation", dB: 60, amplitude: 0.3 },
    { name: "City Traffic", dB: 80, amplitude: 0.6 },
    { name: "Lawn Mower", dB: 90, amplitude: 0.75 },
    { name: "Rock Concert", dB: 110, amplitude: 0.9 },
    { name: "Threshold of Pain", dB: 130, amplitude: 1.0 },
  ];

  // Convert linear amplitude (0-1) to dB (using a rough approximation)
  const amplitudeToDb = (amp) => {
    if (amp <= 0) return 0;
    return Math.round(20 * Math.log10(amp) + 100);
  };

  // Find the closest sound comparison
  const findClosestSound = () => {
    let closest = soundComparisons[0];
    let minDiff = Math.abs(amplitude - closest.amplitude);

    soundComparisons.forEach((sound) => {
      const diff = Math.abs(amplitude - sound.amplitude);
      if (diff < minDiff) {
        minDiff = diff;
        closest = sound;
      }
    });

    return closest;
  };

  // Update visualization
  const updateVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, height);

    // Draw center line
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = "#10B981"; // Green color
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Calculate visual amplitude (scaled for visibility)
    const waveAmplitude = (height / 2 - 10) * amplitude;

    // Adjust number of cycles based on frequency
    const cycles = Math.min(10, Math.max(2, frequency / 110));

    for (let x = 0; x < width; x++) {
      const ratio = x / width;
      const angle = ratio * Math.PI * 2 * cycles + phaseRef.current;
      const y = height / 2 + Math.sin(angle) * waveAmplitude;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw labels
    ctx.font = "14px Arial";
    ctx.fillStyle = "#E2E8F0";
    ctx.textAlign = "center";

    // Frequency value and range
    ctx.fillText(`${frequency} Hz`, width / 2, 30);
    ctx.fillStyle = "#10B981";
    ctx.fillText("Mid Range", width / 2, 50);

    // Update phase
    phaseRef.current += 0.05;

    // Request next frame
    animationRef.current = requestAnimationFrame(updateVisualization);
  };

  // Start visualization
  useEffect(() => {
    if (canvasRef.current) {
      updateVisualization();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [amplitude, frequency]); // Re-run when amplitude or frequency changes

  // Update oscillator frequency
  useEffect(() => {
    if (isPlaying && oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        frequency,
        audioContextRef.current.currentTime
      );
    }
  }, [frequency, isPlaying]);

  // Update amplitude while playing
  useEffect(() => {
    if (isPlaying && gainNodeRef.current && audioContextRef.current) {
      // Safety cap to prevent very loud sounds
      const safeAmplitude = Math.min(amplitude, 0.5);
      gainNodeRef.current.gain.setValueAtTime(
        safeAmplitude,
        audioContextRef.current.currentTime
      );
    }
  }, [amplitude, isPlaying]);

  // Start or update oscillator
  const startOscillator = () => {
    // Create AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop current oscillator if it exists
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create gain node if it doesn't exist or reconnect it
    if (!gainNodeRef.current) {
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;
    }

    // Set the gain (volume) based on amplitude
    // Using a safety cap to prevent very loud sounds
    gainNodeRef.current.gain.value = Math.min(amplitude, 0.5);

    // Create and configure oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNodeRef.current);
    oscillator.start();
    oscillatorRef.current = oscillator;

    setIsPlaying(true);
  };

  // Stop oscillator
  const stopOscillator = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  // Toggle play state
  const togglePlay = () => {
    if (isPlaying) {
      stopOscillator();
    } else {
      startOscillator();
    }
  };

  // Get closest sound comparison
  const closestSound = findClosestSound();

  return (
    <div className="amplitude-demo">
      <div className="visualization-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="amplitude-canvas"
        />
      </div>

      <div className="controls">
        <div className="amplitude-section">
          <label>Amplitude:</label>
          <input
            type="range"
            min="0.0001"
            max="1"
            step="0.001"
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            className="amplitude-slider"
          />
          <div className="amplitude-values">
            <span>Amplitude: {amplitude.toFixed(2)}</span>
            <span>Approximate: {amplitudeToDb(amplitude)} dB</span>
          </div>
        </div>

        <div className="frequency-section">
          <label>Frequency:</label>
          <div className="frequency-buttons">
            <button
              className={frequency === 110 ? "active" : ""}
              onClick={() => setFrequency(110)}
            >
              Low
              <br />
              (110 Hz)
            </button>
            <button
              className={frequency === 440 ? "active" : ""}
              onClick={() => setFrequency(440)}
            >
              Medium
              <br />
              (440 Hz)
            </button>
            <button
              className={frequency === 1760 ? "active" : ""}
              onClick={() => setFrequency(1760)}
            >
              High
              <br />
              (1760 Hz)
            </button>
          </div>
        </div>

        <button onClick={togglePlay} className="play-button">
          {isPlaying ? "Stop Sound" : "Play Sound"}
        </button>
      </div>

      <div className="sound-comparisons">
        <h3>Sound Level Comparison</h3>
        <div className="comparison-scale">
          {soundComparisons.map((sound, index) => (
            <div
              key={index}
              className={`comparison-item ${
                sound.name === closestSound.name ? "current" : ""
              }`}
              style={{
                left: `${Math.min(100, Math.max(0, (sound.dB / 130) * 100))}%`,
              }}
            >
              <div className="comparison-marker"></div>
              <div className="comparison-label">
                <div className="comparison-db">{sound.dB} dB</div>
                <div className="comparison-name">{sound.name}</div>
              </div>
            </div>
          ))}

          <div
            className="current-marker"
            style={{
              left: `${Math.min(
                100,
                Math.max(0, (amplitudeToDb(amplitude) / 130) * 100)
              )}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="amplitude-info">
        <p>
          <strong>Amplitude</strong> refers to the magnitude of a sound wave's
          pressure variation. It determines how loud a sound is perceived. We
          typically measure sound intensity in decibels (dB), which is a
          logarithmic scale that better matches how our ears perceive loudness.
        </p>
        <p>
          The current amplitude ({amplitude.toFixed(2)}) corresponds to
          approximately <strong>{amplitudeToDb(amplitude)} dB</strong>, which is
          similar to a <strong>{closestSound.name}</strong> in loudness.
        </p>
        <div className="info-facts">
          <div className="info-fact">
            <div className="fact-title">Logarithmic Scale</div>
            <div className="fact-desc">
              A 10 dB increase represents approximately a doubling of perceived
              loudness.
            </div>
          </div>
          <div className="info-fact">
            <div className="fact-title">Hearing Damage</div>
            <div className="fact-desc">
              Prolonged exposure to sounds above 85 dB can cause hearing damage.
            </div>
          </div>
          <div className="info-fact">
            <div className="fact-title">Dynamic Range</div>
            <div className="fact-desc">
              The human ear can detect sounds across a remarkable range of about
              130 dB.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .amplitude-demo {
          background-color: #1e293b;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          color: #f8fafc;
        }

        .visualization-container {
          margin-bottom: 20px;
          background-color: #0f172a;
          border-radius: 8px;
          overflow: hidden;
        }

        .amplitude-canvas {
          width: 100%;
          height: 200px;
          background-color: #0f172a;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }

        .amplitude-section,
        .frequency-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          color: #94a3b8;
          font-size: 14px;
        }

        .amplitude-slider {
          width: 100%;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: #334155;
          border-radius: 3px;
          outline: none;
        }

        .amplitude-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #93c5fd;
          border-radius: 50%;
          cursor: pointer;
        }

        .amplitude-values {
          display: flex;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 14px;
        }

        .frequency-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .frequency-buttons button {
          padding: 12px;
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 4px;
          color: #f8fafc;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          line-height: 1.2;
        }

        .frequency-buttons button:hover {
          background-color: #334155;
        }

        .frequency-buttons button.active {
          background-color: #93c5fd;
          border-color: #93c5fd;
          color: #0f172a;
        }

        .play-button {
          padding: 12px 24px;
          background-color: #93c5fd;
          color: #0f172a;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          width: fit-content;
        }

        .play-button:hover {
          background-color: #60a5fa;
        }

        .sound-comparisons {
          background-color: #0f172a;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .sound-comparisons h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #f8fafc;
        }

        .comparison-scale {
          position: relative;
          height: 100px;
          background: linear-gradient(
            to right,
            #93c5fd 0%,
            /* Bass - Light blue */ #10b981 40%,
            /* Mid - Green */ #f59e0b 70%,
            /* High - Orange */ #ef4444 100% /* Very High - Red */
          );
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .comparison-item {
          position: absolute;
          transform: translateX(-50%);
        }

        .comparison-marker {
          width: 2px;
          height: 10px;
          background-color: #f8fafc;
          margin: 0 auto;
        }

        .comparison-label {
          padding-top: 4px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
          width: 80px;
          transform: translateX(-50%);
        }

        .comparison-db {
          font-weight: bold;
        }

        .comparison-name {
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .comparison-item.current .comparison-label {
          color: #f8fafc;
          font-weight: bold;
        }

        .current-marker {
          position: absolute;
          top: 0;
          width: 4px;
          height: 100%;
          background-color: #f8fafc;
          transform: translateX(-50%);
        }

        .amplitude-info {
          background-color: #0f172a;
          padding: 16px;
          border-radius: 6px;
        }

        .amplitude-info p {
          margin: 0 0 12px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #f8fafc;
        }

        .info-facts {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 16px;
        }

        .info-fact {
          background-color: #1e293b;
          padding: 12px;
          border-radius: 6px;
          border-left: 3px solid #93c5fd;
        }

        .fact-title {
          font-weight: 600;
          font-size: 14px;
          color: #f8fafc;
          margin-bottom: 4px;
        }

        .fact-desc {
          font-size: 13px;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .info-facts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AmplitudeDemo;
